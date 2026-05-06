-- ============================================================
-- Precise Aesthetics — Admin Utilities (Session P13)
-- ============================================================
-- Three units of work, single migration:
--
-- 1. vendors — admin contact directory (manufacturers, software
--    vendors, service providers, etc.). RLS Class C, admin-only.
--
-- 2. stack_services + stack_env_vars — pointer index for the
--    services we depend on + the env var NAMES per service.
--    NEVER stores secret values. The schema itself is the first
--    guardrail (no `value` column on stack_env_vars).
--
-- 3. agent_runs.agent_type extended to include 'help_assistant'
--    so the new admin help chatbot writes to the same audit
--    trail as the other six P11 agents.
--
-- ============================================================
-- HOLD: review before applying. Per CLAUDE.md DB safety rules.
-- ============================================================
-- READ CAREFULLY:
--
-- 1. NO `value` column on stack_env_vars. This is intentional and
--    non-negotiable. The route handler at /api/admin/stack/[id]
--    /env-vars also rejects any request body containing a `value`
--    field as defense-in-depth. The schema is the first line.
--
-- 2. set_updated_at() is already defined in 0001_initial_schema.sql.
--    The create-or-replace block here is defensive — running this
--    migration on a DB without 0001 (unlikely but possible during
--    a fresh local Supabase setup for the RLS audit) still works.
--
-- 3. agent_runs.agent_type CHECK constraint replaced (drop old,
--    add new). Postgres auto-named the original constraint
--    `agent_runs_agent_type_check`. If a different name was
--    chosen at apply time, the drop is a no-op and the add still
--    works (Postgres allows multiple CHECK constraints; the old
--    becomes redundant). Manual review of pg_constraint after
--    applying recommended.
-- ============================================================

-- ------------------------------------------------------------
-- 0. set_updated_at — defensive create-or-replace
-- ------------------------------------------------------------
-- Defined in 0001 already; replicated here so this migration
-- can run on a fresh schema without 0001 dependency (e.g.,
-- against a RLS-audit local Supabase that pulls schema dump).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- 1. vendors
-- ============================================================
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Identity
  name text not null,
  category text not null check (category in (
    'manufacturer',
    'software_vendor',
    'service_provider',
    'logistics',
    'professional_services',
    'other'
  )),
  description text,

  -- Primary contact
  contact_name text,
  contact_email text,
  contact_phone text,

  -- Messaging handles — JSONB list of { platform: string, handle: string }
  -- objects. Platform is one of the curated list in the form (WhatsApp,
  -- Telegram, Signal, Slack, Discord, LinkedIn, X, etc.) or "Other" for
  -- free-text. Defaults to empty array so existing search queries don't
  -- need to handle null.
  messaging_handles jsonb not null default '[]'::jsonb,

  -- Web presence
  website text,

  -- Account info
  account_id text,

  -- Internal notes
  notes text,

  -- Status (soft-delete via 'former'; never hard-delete)
  status text not null default 'active' check (status in ('active', 'paused', 'former')),

  -- Metadata
  created_by uuid references auth.users(id) on delete set null,
  last_updated_by uuid references auth.users(id) on delete set null
);

create index idx_vendors_category on public.vendors (category);
create index idx_vendors_status on public.vendors (status);
create index idx_vendors_name on public.vendors (name);

create trigger trg_vendors_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- vendors RLS — Class C (admin only)
-- ------------------------------------------------------------
alter table public.vendors enable row level security;

create policy vendors_admin_all on public.vendors
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 2. stack_services
-- ============================================================
create table public.stack_services (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Identity
  name text not null,
  category text not null check (category in (
    'hosting',
    'database',
    'auth',
    'email',
    'cms',
    'ai',
    'analytics',
    'monitoring',
    'storage',
    'domain',
    'payment',
    'other'
  )),
  what_it_does text not null,

  -- Plan + cost
  plan_tier text,
  monthly_cost_estimate_usd numeric(10, 2),
  renewal_date date,

  -- Access
  login_url text,
  account_owner_user_id uuid references auth.users(id) on delete set null,

  -- Where credentials live (NEVER the credentials themselves)
  credentials_storage_location text,

  -- Support + docs
  support_contact text,
  documentation_links text,

  -- Status
  status text not null default 'active' check (status in ('active', 'paused', 'former')),

  -- Internal notes
  notes text,

  -- Metadata
  created_by uuid references auth.users(id) on delete set null,
  last_updated_by uuid references auth.users(id) on delete set null
);

create index idx_stack_services_category on public.stack_services (category);
create index idx_stack_services_status on public.stack_services (status);
create index idx_stack_services_name on public.stack_services (name);

create trigger trg_stack_services_updated_at
  before update on public.stack_services
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- stack_services RLS — Class C (admin only)
-- ------------------------------------------------------------
alter table public.stack_services enable row level security;

create policy stack_services_admin_all on public.stack_services
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 3. stack_env_vars
-- ============================================================
-- CRITICAL: this table indexes the SHAPE of our secrets (names +
-- where they live), NEVER the secret values themselves. There is
-- no `value` column. The route handler also rejects any request
-- body containing a `value` field as defense-in-depth.
create table public.stack_env_vars (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  service_id uuid not null references public.stack_services(id) on delete cascade,

  -- Just the name, never the value
  var_name text not null,
  description text,

  -- Where the value is set
  set_in_vercel boolean not null default false,
  set_in_local_env boolean not null default false,

  -- Sensitivity classification
  -- Default: true (assume secret). NEXT_PUBLIC_* defaults to false
  -- via server-side logic in /api/admin/stack/[id]/env-vars POST.
  is_secret boolean not null default true,

  unique (service_id, var_name)
);

create index idx_stack_env_vars_service_id on public.stack_env_vars (service_id);

-- ------------------------------------------------------------
-- stack_env_vars RLS — Class C (admin only)
-- ------------------------------------------------------------
alter table public.stack_env_vars enable row level security;

create policy stack_env_vars_admin_all on public.stack_env_vars
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 4. Extend agent_runs.agent_type to include 'help_assistant'
-- ============================================================
-- Drop the existing CHECK constraint (auto-named by Postgres in
-- 0014) and re-add with the expanded list including the new
-- help chatbot agent.
alter table public.agent_runs
  drop constraint if exists agent_runs_agent_type_check;

alter table public.agent_runs
  add constraint agent_runs_agent_type_check
  check (agent_type in (
    'pattern_analyst',
    'protocol_drafter',
    'practice_health_reviewer',
    'communication_drafter',
    'query_assistant',
    'lead_enricher',
    'help_assistant'
  ));
