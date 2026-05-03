-- ============================================================
-- Precise Aesthetics — Practices + Devices (Session P2)
-- ============================================================
-- Practice account model and device catalog. Builds on the RLS
-- helpers from 0004_rls_framework.sql (auth_role, is_admin,
-- is_practice, current_practice_id).
--
-- P3+ depends on practice_id being populated in JWT app_metadata
-- during provisioning (handled application-side by the admin API
-- in /api/admin/practices). The current_practice_id() helper from
-- 0004 reads that claim.
-- ============================================================
-- HOLD: review before applying to production Supabase. Per
-- CLAUDE.md database safety rules — never run automatically.
-- ============================================================

-- ------------------------------------------------------------
-- practices — one row per practice account
-- ------------------------------------------------------------
create table public.practices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Identity
  name text not null,
  primary_email text not null,
  phone text,

  -- Address
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text default 'US',

  -- Status lifecycle: pending → active (after setup wizard) → suspended/archived
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'archived')),
  status_changed_at timestamptz default now(),
  status_changed_by uuid references auth.users(id),

  -- Auth linkage. unique() so one auth user → at most one practice.
  auth_user_id uuid references auth.users(id) unique,

  -- Provisioning context (who created it, when)
  provisioned_by uuid references auth.users(id),
  provisioned_at timestamptz default now(),

  -- Internal notes (admin-only, never shown to practice)
  internal_notes text
);

create index idx_practices_status on public.practices(status);
create index idx_practices_auth_user_id on public.practices(auth_user_id);
create index idx_practices_primary_email on public.practices(lower(primary_email));

-- updated_at auto-bump
create trigger practices_updated_at
  before update on public.practices
  for each row execute function public.set_updated_at();

alter table public.practices enable row level security;

-- Class A — practice-owned, but admin manages writes (practice can only read)
create policy "practices admin all"
  on public.practices for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "practices read: own"
  on public.practices for select
  using (
    public.is_practice()
    and id = public.current_practice_id()
  );


-- ------------------------------------------------------------
-- practice_users — authorized users at the practice (NAMES only,
-- NOT login accounts). Pre-populates the "entered by" dropdown on
-- treatment logs in P6.
-- ------------------------------------------------------------
create table public.practice_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  practice_id uuid not null references public.practices(id) on delete cascade,

  full_name text not null,
  role_at_practice text,             -- "Practitioner", "MA", "Front desk" — free text
  is_active boolean not null default true,
  notes text
);

create index idx_practice_users_practice_id
  on public.practice_users(practice_id);

alter table public.practice_users enable row level security;

create policy "practice_users admin all"
  on public.practice_users for all
  using (public.is_admin())
  with check (public.is_admin());

-- Practice has full CRUD on their own users (self-service per master spec)
create policy "practice_users read: own"
  on public.practice_users for select
  using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

create policy "practice_users insert: own"
  on public.practice_users for insert
  with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

create policy "practice_users update: own"
  on public.practice_users for update
  using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

create policy "practice_users delete: own"
  on public.practice_users for delete
  using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );


-- ------------------------------------------------------------
-- devices — catalog of products Precise sells (Class B per
-- RLS-PATTERNS.md: admin-managed, practice reads what's relevant)
-- ------------------------------------------------------------
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  slug text not null unique,        -- 'precise-pico', 'precise-rf' (future)
  display_name text not null,       -- 'Precise Pico™'
  short_description text,
  is_active boolean not null default true,
  sort_order integer default 0
);

alter table public.devices enable row level security;

create policy "devices admin all"
  on public.devices for all
  using (public.is_admin())
  with check (public.is_admin());

-- Practices read all active devices so the protocol library knows
-- what's "available" for them to potentially own.
create policy "devices read: practice (active)"
  on public.devices for select
  using (
    public.is_practice()
    and is_active = true
  );

-- Seed: Precise Pico™ (the first and only device at launch)
insert into public.devices (slug, display_name, short_description, sort_order) values
  ('precise-pico', 'Precise Pico™', 'Multi-wavelength pico laser', 1);


-- ------------------------------------------------------------
-- practice_devices — which devices each practice owns. Drives
-- protocol library filtering in P5.
-- ------------------------------------------------------------
create table public.practice_devices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  device_id uuid not null references public.devices(id),

  -- Per-installation provenance
  serial_number text,
  acquired_at date,
  notes text,

  -- One row per (practice, device) pair — practice can't "own" the same
  -- device twice. If a practice acquires a 2nd unit of the same model,
  -- represent it via additional notes/serials in the same row, not a duplicate.
  unique(practice_id, device_id)
);

create index idx_practice_devices_practice_id
  on public.practice_devices(practice_id);
create index idx_practice_devices_device_id
  on public.practice_devices(device_id);

alter table public.practice_devices enable row level security;

create policy "practice_devices admin all"
  on public.practice_devices for all
  using (public.is_admin())
  with check (public.is_admin());

-- Practice reads only their own ownership records.
create policy "practice_devices read: own"
  on public.practice_devices for select
  using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );
