-- ============================================================
-- Precise Aesthetics — Training Library + Certification (P9)
-- ============================================================
-- Six tables forming the training & certification pipeline:
--
--   training_modules         — individual lessons (video + materials)
--   training_curricula       — collections of modules tied to a device
--   curriculum_modules       — M:N ordering of modules within a curriculum
--                              (intentional M:N — modules can be shared
--                               across device-specific curricula, e.g.
--                               "laser physics fundamentals")
--   module_materials         — supporting files per module
--   module_progress          — Class A per-practice/user watch tracking
--   practice_certifications  — Class A per-device certification status
--
-- A SECURITY DEFINER RPC `is_practice_certified_for_device` is the
-- single source of truth for the treatment-logging gate (see P6's
-- POST /api/portal/treatments — extended in P9 to call this RPC
-- before allowing inserts).
--
-- ============================================================
-- HOLD: review before applying to production Supabase. Per
-- CLAUDE.md database safety rules — never run automatically.
-- ============================================================
-- READING ORDER:
--   1. tables (in dependency order)
--   2. indexes
--   3. updated_at triggers (reuses public.set_updated_at from 0001)
--   4. RLS enable + policies
--   5. RPC for the treatment gate
-- ============================================================

-- ------------------------------------------------------------
-- 1. training_modules — individual lessons
-- ------------------------------------------------------------
create table public.training_modules (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  title text not null,
  slug text not null unique,
  description text,

  -- Video lives in Supabase Storage 'training-videos' bucket.
  -- Direct-to-storage upload from admin client (bypasses Vercel
  -- body limit). Duration captured client-side from <video>
  -- metadata before upload; thumbnail uploaded manually.
  video_storage_path text,
  video_duration_seconds integer,
  video_thumbnail_path text,

  -- Completion criteria — practice user must watch >= this %
  -- before the acknowledgment checkbox unlocks.
  required_watch_percentage integer not null default 90
    check (required_watch_percentage between 50 and 100),

  -- Status
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,

  -- Authoring
  created_by uuid references auth.users(id) on delete set null,
  last_updated_by uuid references auth.users(id) on delete set null
);

-- ------------------------------------------------------------
-- 2. training_curricula — one per device (UNIQUE on device_id)
-- ------------------------------------------------------------
create table public.training_curricula (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  device_id uuid not null references public.devices(id) on delete cascade,
  title text not null,
  description text,

  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,

  created_by uuid references auth.users(id) on delete set null,
  last_updated_by uuid references auth.users(id) on delete set null,

  unique (device_id)
);

-- ------------------------------------------------------------
-- 3. curriculum_modules — ordered M:N join
-- ------------------------------------------------------------
create table public.curriculum_modules (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  curriculum_id uuid not null
    references public.training_curricula(id) on delete cascade,
  module_id uuid not null
    references public.training_modules(id) on delete cascade,
  sort_order integer not null,
  is_required boolean not null default true,

  unique (curriculum_id, module_id),
  unique (curriculum_id, sort_order)
);

-- ------------------------------------------------------------
-- 4. module_materials — supporting files (PDFs, slides, etc.)
-- ------------------------------------------------------------
create table public.module_materials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  module_id uuid not null
    references public.training_modules(id) on delete cascade,

  title text not null,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  byte_size integer not null,
  sort_order integer not null default 0
);

-- ------------------------------------------------------------
-- 5. module_progress — per-practice-user watch tracking (Class A)
-- ------------------------------------------------------------
-- Note: practice_user_id is the practice_authorized_users.id
-- (matches the entered_by_user_id pattern from P6 treatments).
-- Stays nullable so cascade-on-deleted-user keeps the row for
-- audit purposes.
create table public.module_progress (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  practice_id uuid not null
    references public.practices(id) on delete cascade,
  practice_user_id uuid
    references public.practice_authorized_users(id) on delete set null,
  module_id uuid not null
    references public.training_modules(id) on delete cascade,

  -- Watch tracking — server-trusted; client posts updates every 10s.
  watch_percentage integer not null default 0
    check (watch_percentage between 0 and 100),
  last_position_seconds integer not null default 0,
  watch_started_at timestamptz default now(),
  watch_completed_at timestamptz,

  -- Acknowledgment + completion
  acknowledged boolean not null default false,
  acknowledged_at timestamptz,
  is_complete boolean not null default false,
  completed_at timestamptz,

  unique (practice_id, practice_user_id, module_id)
);

-- ------------------------------------------------------------
-- 6. practice_certifications — per-practice, per-device (Class A)
-- ------------------------------------------------------------
create table public.practice_certifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  practice_id uuid not null
    references public.practices(id) on delete cascade,
  device_id uuid not null
    references public.devices(id) on delete cascade,
  curriculum_id uuid not null
    references public.training_curricula(id),

  status text not null default 'in_progress'
    check (status in ('in_progress', 'certified', 'expired', 'revoked')),

  -- Completion details — certified_by_user_id matches treatment
  -- logging's entered_by_user_id pattern (FK to
  -- practice_authorized_users, not auth.users).
  certified_at timestamptz,
  certified_by_user_id uuid
    references public.practice_authorized_users(id) on delete set null,

  -- Re-cert tracking — flag-only in P9. Admin sets recert_required;
  -- banner surfaces in portal but does NOT revoke certification.
  -- Auto-triggers (e.g. on protocol major-version bump) are deferred.
  expires_at timestamptz,
  recert_required boolean not null default false,
  recert_reason text,

  unique (practice_id, device_id)
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
create index idx_training_modules_status on public.training_modules (status);
create index idx_training_modules_slug on public.training_modules (slug);

create index idx_training_curricula_device_id on public.training_curricula (device_id);
create index idx_training_curricula_status on public.training_curricula (status);

create index idx_curriculum_modules_curriculum_id on public.curriculum_modules (curriculum_id);
create index idx_curriculum_modules_module_id on public.curriculum_modules (module_id);

create index idx_module_materials_module_id on public.module_materials (module_id);

create index idx_module_progress_practice_id on public.module_progress (practice_id);
create index idx_module_progress_module_id on public.module_progress (module_id);
create index idx_module_progress_complete
  on public.module_progress (is_complete) where is_complete = true;

create index idx_practice_certifications_practice_id
  on public.practice_certifications (practice_id);
create index idx_practice_certifications_device_id
  on public.practice_certifications (device_id);
create index idx_practice_certifications_status
  on public.practice_certifications (status);

-- ------------------------------------------------------------
-- updated_at triggers (reuse public.set_updated_at from 0001)
-- ------------------------------------------------------------
create trigger trg_training_modules_updated_at
  before update on public.training_modules
  for each row execute function public.set_updated_at();

create trigger trg_training_curricula_updated_at
  before update on public.training_curricula
  for each row execute function public.set_updated_at();

create trigger trg_module_progress_updated_at
  before update on public.module_progress
  for each row execute function public.set_updated_at();

create trigger trg_practice_certifications_updated_at
  before update on public.practice_certifications
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row-Level Security
-- ============================================================

-- ------------------------------------------------------------
-- training_modules — Class B (admin all, practice read published)
-- ------------------------------------------------------------
alter table public.training_modules enable row level security;

create policy training_modules_admin_all on public.training_modules
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy training_modules_practice_read_published on public.training_modules
  for select
  using (public.is_practice() and status = 'published');

-- ------------------------------------------------------------
-- training_curricula — Class B + device-ownership gate for practices
-- ------------------------------------------------------------
alter table public.training_curricula enable row level security;

create policy training_curricula_admin_all on public.training_curricula
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy training_curricula_practice_read_owned_devices
  on public.training_curricula
  for select
  using (
    public.is_practice()
    and status = 'published'
    and exists (
      select 1 from public.practice_devices pd
      where pd.practice_id = public.current_practice_id()
        and pd.device_id = training_curricula.device_id
    )
  );

-- ------------------------------------------------------------
-- curriculum_modules — Class B; visible to practice if parent
-- curriculum is visible (gates by device ownership transitively)
-- ------------------------------------------------------------
alter table public.curriculum_modules enable row level security;

create policy curriculum_modules_admin_all on public.curriculum_modules
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy curriculum_modules_practice_read on public.curriculum_modules
  for select
  using (
    public.is_practice()
    and exists (
      select 1
      from public.training_curricula tc
      join public.practice_devices pd on pd.device_id = tc.device_id
      where tc.id = curriculum_modules.curriculum_id
        and tc.status = 'published'
        and pd.practice_id = public.current_practice_id()
    )
  );

-- ------------------------------------------------------------
-- module_materials — Class B (read-only for practices on
-- published modules)
-- ------------------------------------------------------------
alter table public.module_materials enable row level security;

create policy module_materials_admin_all on public.module_materials
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy module_materials_practice_read on public.module_materials
  for select
  using (
    public.is_practice()
    and exists (
      select 1 from public.training_modules tm
      where tm.id = module_materials.module_id
        and tm.status = 'published'
    )
  );

-- ------------------------------------------------------------
-- module_progress — Class A (practice CRUDs own progress)
-- ------------------------------------------------------------
alter table public.module_progress enable row level security;

create policy module_progress_admin_all on public.module_progress
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy module_progress_practice_crud_own on public.module_progress
  for all
  using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

-- ------------------------------------------------------------
-- practice_certifications — Class A (practice CRUDs own;
-- admin can also flip recert_required + revoke)
-- ------------------------------------------------------------
alter table public.practice_certifications enable row level security;

create policy practice_certifications_admin_all on public.practice_certifications
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy practice_certifications_practice_read_own
  on public.practice_certifications
  for select
  using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

create policy practice_certifications_practice_insert_own
  on public.practice_certifications
  for insert
  with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

create policy practice_certifications_practice_update_own
  on public.practice_certifications
  for update
  using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

-- ============================================================
-- RPC: is_practice_certified_for_device
-- ============================================================
-- Single source of truth for the treatment-logging gate. Called
-- by both UI (filter protocol selector to certified devices) and
-- by POST /api/portal/treatments (server-side enforcement).
-- SECURITY DEFINER so callers don't need direct read access to
-- practice_certifications — we control the answer surface.
-- ============================================================
create or replace function public.is_practice_certified_for_device(
  p_practice_id uuid,
  p_device_id uuid
) returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.practice_certifications
    where practice_id = p_practice_id
      and device_id = p_device_id
      and status = 'certified'
      and (expires_at is null or expires_at > now())
  );
end;
$$;
