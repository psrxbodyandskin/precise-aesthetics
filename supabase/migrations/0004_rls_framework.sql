-- ============================================================
-- Precise Aesthetics — RLS Framework (Session P1)
-- ============================================================
-- Foundational helper functions and conventions used by every
-- portal/admin table from P2 onward. NO data tables defined here.
-- ============================================================
-- HOLD: review before applying to production Supabase. Per
-- CLAUDE.md database safety rules — never run automatically.
-- ============================================================

-- ------------------------------------------------------------
-- Role helpers
-- ------------------------------------------------------------
-- Roles live in `auth.users.raw_app_meta_data ->> 'role'` (set via the
-- service role / admin API only; NEVER from user_metadata, which is
-- user-editable and unsafe for authorization).
--
-- These wrapper functions are the canonical way for RLS policies to
-- read role and practice_id. Centralizing here means one place to fix
-- if Supabase changes the JWT claim layout.
-- ------------------------------------------------------------

create or replace function public.auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    null
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() = 'admin';
$$;

create or replace function public.is_practice()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() = 'practice';
$$;

-- Returns the practice_id claim from the JWT. Returns NULL until P2
-- adds the practices table and starts populating this claim during
-- account provisioning.
create or replace function public.current_practice_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select nullif(
    auth.jwt() -> 'app_metadata' ->> 'practice_id',
    ''
  )::uuid;
$$;

-- ------------------------------------------------------------
-- Audit log
-- ------------------------------------------------------------
-- Every admin write action (account provisioning, protocol changes,
-- adverse event status updates, etc.) inserts a row here via the
-- helper below. Required for clinical software compliance trails.
-- ------------------------------------------------------------

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,                  -- 'practice' | 'admin' | null at time of action
  action text not null,             -- e.g. 'practice.invite', 'protocol.publish', 'adverse_event.review'
  target_type text,                 -- e.g. 'practice', 'protocol', 'adverse_event'
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet
);

create index idx_audit_log_created_at
  on public.audit_log (created_at desc);

create index idx_audit_log_actor
  on public.audit_log (actor_id, created_at desc);

create index idx_audit_log_target
  on public.audit_log (target_type, target_id, created_at desc);

create index idx_audit_log_action
  on public.audit_log (action, created_at desc);

alter table public.audit_log enable row level security;

-- Admins can read all audit log entries. Nobody can update/delete (it's
-- an append-only ledger). Service role inserts via the helper function.
create policy "audit_log read: admin"
  on public.audit_log for select
  using (public.is_admin());

create policy "audit_log no_update"
  on public.audit_log for update
  using (false);

create policy "audit_log no_delete"
  on public.audit_log for delete
  using (false);

-- Helper used by application code (called via service-role client) to
-- record an audit event. The application layer is responsible for
-- providing actor_id, actor_role, and ip_address — the DB just stores.
create or replace function public.log_audit(
  p_actor_id uuid,
  p_actor_role text,
  p_action text,
  p_target_type text default null,
  p_target_id uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_ip_address inet default null
)
returns uuid
language sql
security definer
set search_path = public
as $$
  insert into public.audit_log (
    actor_id, actor_role, action, target_type, target_id, metadata, ip_address
  )
  values (
    p_actor_id, p_actor_role, p_action, p_target_type, p_target_id, p_metadata, p_ip_address
  )
  returning id;
$$;

-- ============================================================
-- POLICY TEMPLATE — applied to every practice-owned table from P2 on
-- ============================================================
-- (Reference template only. NOT executed here. Spec lives in
--  spec/RLS-PATTERNS.md and is invoked verbatim per future migration.)
--
-- Table layout for practice-owned data:
--   create table public.example_table (
--     id uuid primary key default gen_random_uuid(),
--     practice_id uuid not null references public.practices(id) on delete cascade,
--     ... other fields ...
--     created_at timestamptz not null default now()
--   );
--   create index idx_example_table_practice on public.example_table (practice_id);
--   alter table public.example_table enable row level security;
--
-- Policies:
--   create policy "example_table read: own practice"
--     on public.example_table for select
--     using (practice_id = public.current_practice_id());
--
--   create policy "example_table insert: own practice"
--     on public.example_table for insert
--     with check (practice_id = public.current_practice_id());
--
--   create policy "example_table update: own practice"
--     on public.example_table for update
--     using (practice_id = public.current_practice_id())
--     with check (practice_id = public.current_practice_id());
--
--   create policy "example_table delete: own practice"
--     on public.example_table for delete
--     using (practice_id = public.current_practice_id());
--
--   create policy "example_table read: admin all"
--     on public.example_table for select
--     using (public.is_admin());
-- ============================================================
