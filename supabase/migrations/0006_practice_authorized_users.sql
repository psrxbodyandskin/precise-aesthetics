-- ============================================================
-- Precise Aesthetics — Practice Authorized Users (Session P3)
-- ============================================================
-- Practitioner-managed list of names that pre-populates the
-- "entered by" dropdown on treatment logs in P6. Distinct from
-- public.practice_users (which is the admin-side membership /
-- invite linkage record from P2): this table is owned and edited
-- by the practice itself, has no auth linkage, and represents
-- people in the practice who may enter treatment data.
--
-- Free-text role label per spec — no enum. Practices have weird
-- role names (RN, NP, esthetician, "Dr. Smith's assistant"); the
-- UI offers suggested chips but never forces taxonomy.
-- ============================================================
-- HOLD: review before applying to production Supabase. Per
-- CLAUDE.md database safety rules — never run automatically.
-- ============================================================

create table public.practice_authorized_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  practice_id uuid not null references public.practices(id) on delete cascade,

  full_name text not null,
  role_label text,                    -- free text: "Practitioner", "RN", "Dr. Smith's MA", etc.
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create index idx_practice_authorized_users_practice_id
  on public.practice_authorized_users(practice_id);

create index idx_practice_authorized_users_active
  on public.practice_authorized_users(practice_id, is_active)
  where is_active = true;

create trigger practice_authorized_users_updated_at
  before update on public.practice_authorized_users
  for each row execute function public.set_updated_at();

alter table public.practice_authorized_users enable row level security;

-- Admin: full access (read for support, write for cleanup if requested)
create policy "practice_authorized_users admin all"
  on public.practice_authorized_users for all
  using (public.is_admin())
  with check (public.is_admin());

-- Class A — practice has full CRUD on their own roster (self-service)
create policy "practice_authorized_users read: own"
  on public.practice_authorized_users for select
  using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

create policy "practice_authorized_users insert: own"
  on public.practice_authorized_users for insert
  with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

create policy "practice_authorized_users update: own"
  on public.practice_authorized_users for update
  using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

create policy "practice_authorized_users delete: own"
  on public.practice_authorized_users for delete
  using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );
