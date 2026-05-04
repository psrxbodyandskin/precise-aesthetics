-- ============================================================
-- Precise Aesthetics — Inbox Status Workflow (Session P8)
-- ============================================================
-- Adds status workflow columns + admin notes to all three
-- inbound tables (leads, demo_requests, contact_messages).
-- Adds enrichment placeholder columns to leads + demo_requests
-- (reserved for the P11 Lead Enricher AI agent).
--
-- Defines three SECURITY DEFINER RPCs for the unified admin
-- inbox UI: list_inbox_items, count_inbox_items_by_type,
-- count_inbox_new_items. Each gates on public.is_admin().
-- ============================================================
-- READ CAREFULLY BEFORE APPLYING:
--
-- 1. contact_messages — migration 0003 was authored but NEVER
--    APPLIED to production. This migration includes a
--    `create table if not exists public.contact_messages (...)`
--    block so 0003 lands here transparently. Confirm the table
--    actually exists in prod (or doesn't) before running — the
--    if-not-exists is safe both ways.
--
-- 2. demo_requests.status — the legacy 6-value enum
--    ('new' | 'contacted' | 'demo_scheduled' | 'demo_completed'
--     | 'closed_won' | 'closed_lost') is being narrowed to the
--    shared 4-value workflow ('new' | 'contacted' | 'qualified'
--     | 'closed'). Defensive UPDATE statements run BEFORE the
--    new check constraint is attached, mapping old values:
--      demo_scheduled / demo_completed / closed_won → contacted
--      closed_lost                                    → closed
--    If you have additional non-listed values in production,
--    STOP and reconcile before running.
--
-- 3. RLS — anonymous insert policies are preserved/refined so
--    the public marketing forms (/, /demo, /contact) keep
--    accepting submissions. Admin-all read/update via
--    public.is_admin().
--
-- HOLD: per CLAUDE.md database safety rules, never apply
-- automatically. Manual review required.
-- ============================================================

-- ------------------------------------------------------------
-- Pre-flight: contact_messages from 0003 (idempotent)
-- ------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  organization text,
  subject text not null,
  message text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text
);

create index if not exists idx_contact_messages_created_at
  on public.contact_messages (created_at desc);

create index if not exists idx_contact_messages_email
  on public.contact_messages (lower(email));

alter table public.contact_messages enable row level security;

-- ------------------------------------------------------------
-- 1. leads — add status workflow + enrichment columns
-- ------------------------------------------------------------
alter table public.leads
  add column if not exists status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'closed')),
  add column if not exists status_changed_at timestamptz default now(),
  add column if not exists status_changed_by uuid references auth.users(id) on delete set null,
  add column if not exists admin_notes text,
  add column if not exists enrichment_data jsonb,
  add column if not exists enriched_at timestamptz;

create index if not exists idx_leads_status on public.leads (status);
create index if not exists idx_leads_status_created on public.leads (status, created_at desc);

-- ------------------------------------------------------------
-- 2. demo_requests — narrow legacy 6-value status to 4-value
--    workflow, add admin notes + enrichment columns
-- ------------------------------------------------------------
-- Status column already exists from 0001 (text, default 'new',
-- no check constraint). Map legacy values BEFORE adding the
-- check constraint so existing rows survive the constraint add.
update public.demo_requests
  set status = 'contacted'
  where status in ('demo_scheduled', 'demo_completed', 'closed_won');

update public.demo_requests
  set status = 'closed'
  where status = 'closed_lost';

-- Anything still outside the new 4-value enum becomes 'new' as
-- a safety net (shouldn't fire — covers null or unexpected
-- legacy values).
update public.demo_requests
  set status = 'new'
  where status is null
     or status not in ('new', 'contacted', 'qualified', 'closed');

alter table public.demo_requests
  drop constraint if exists demo_requests_status_check;

alter table public.demo_requests
  add constraint demo_requests_status_check
  check (status in ('new', 'contacted', 'qualified', 'closed'));

alter table public.demo_requests
  add column if not exists status_changed_at timestamptz default now(),
  add column if not exists status_changed_by uuid references auth.users(id) on delete set null,
  add column if not exists admin_notes text,
  add column if not exists enrichment_data jsonb,
  add column if not exists enriched_at timestamptz;

create index if not exists idx_demo_requests_status_created
  on public.demo_requests (status, created_at desc);

-- ------------------------------------------------------------
-- 3. contact_messages — add status workflow (no enrichment;
--    contact messages are usually existing customers, not leads)
-- ------------------------------------------------------------
alter table public.contact_messages
  add column if not exists status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'closed')),
  add column if not exists status_changed_at timestamptz default now(),
  add column if not exists status_changed_by uuid references auth.users(id) on delete set null,
  add column if not exists admin_notes text;

create index if not exists idx_contact_messages_status on public.contact_messages (status);
create index if not exists idx_contact_messages_status_created
  on public.contact_messages (status, created_at desc);

-- ------------------------------------------------------------
-- RLS — refine policies on all three tables
-- ------------------------------------------------------------
-- All tables already have RLS enabled (0001 / 0003-here). Below
-- replaces any prior admin/anon policy with a clean named pair:
--   * <table>_admin_all  — admins do everything (Class C)
--   * <table>_anon_insert — public marketing forms can insert
-- ------------------------------------------------------------

alter table public.leads enable row level security;
alter table public.demo_requests enable row level security;
alter table public.contact_messages enable row level security;

-- leads
drop policy if exists leads_admin_all on public.leads;
create policy leads_admin_all on public.leads
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists leads_anon_insert on public.leads;
create policy leads_anon_insert on public.leads
  for insert
  with check (true);

-- demo_requests
drop policy if exists demo_requests_admin_all on public.demo_requests;
create policy demo_requests_admin_all on public.demo_requests
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists demo_requests_anon_insert on public.demo_requests;
create policy demo_requests_anon_insert on public.demo_requests
  for insert
  with check (true);

-- contact_messages
drop policy if exists contact_messages_admin_all on public.contact_messages;
create policy contact_messages_admin_all on public.contact_messages
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists contact_messages_anon_insert on public.contact_messages;
create policy contact_messages_anon_insert on public.contact_messages
  for insert
  with check (true);

-- ------------------------------------------------------------
-- RPC: list_inbox_items
-- ------------------------------------------------------------
-- Unified UNION across all three inbound tables. Search scope
-- per user-confirmed answer #5: name + email + practice/subject
-- only (UTM and other source metadata excluded from search).
-- ------------------------------------------------------------
create or replace function public.list_inbox_items(
  filter_type text default 'all',
  filter_status text default 'all',
  search_query text default null,
  result_offset int default 0,
  result_limit int default 50
)
returns table(
  type text,
  id uuid,
  received_at timestamptz,
  status text,
  status_changed_at timestamptz,
  display_name text,
  display_email text,
  display_context text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  return query
  with combined as (
    -- Leads
    select
      'lead'::text as type,
      l.id,
      l.created_at as received_at,
      l.status,
      l.status_changed_at,
      coalesce(
        nullif(trim(coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '')), ''),
        'Anonymous lead'
      ) as display_name,
      l.email as display_email,
      coalesce(
        nullif(l.practice_name, ''),
        nullif(l.source, ''),
        'Direct'
      ) as display_context
    from public.leads l
    where (filter_type = 'all' or filter_type = 'lead')
      and (filter_status = 'all' or l.status = filter_status)
      and (search_query is null
        or l.email ilike '%' || search_query || '%'
        or coalesce(l.first_name, '') ilike '%' || search_query || '%'
        or coalesce(l.last_name, '') ilike '%' || search_query || '%'
        or coalesce(l.practice_name, '') ilike '%' || search_query || '%')

    union all

    -- Demo requests
    select
      'demo'::text as type,
      d.id,
      d.created_at as received_at,
      d.status,
      d.status_changed_at,
      (d.first_name || ' ' || d.last_name) as display_name,
      d.email as display_email,
      (d.practice_name ||
        case when coalesce(d.state, '') <> '' then ' · ' || d.state else '' end
      ) as display_context
    from public.demo_requests d
    where (filter_type = 'all' or filter_type = 'demo')
      and (filter_status = 'all' or d.status = filter_status)
      and (search_query is null
        or d.email ilike '%' || search_query || '%'
        or d.first_name ilike '%' || search_query || '%'
        or d.last_name ilike '%' || search_query || '%'
        or d.practice_name ilike '%' || search_query || '%')

    union all

    -- Contact messages
    select
      'contact'::text as type,
      c.id,
      c.created_at as received_at,
      c.status,
      c.status_changed_at,
      c.full_name as display_name,
      c.email as display_email,
      c.subject as display_context
    from public.contact_messages c
    where (filter_type = 'all' or filter_type = 'contact')
      and (filter_status = 'all' or c.status = filter_status)
      and (search_query is null
        or c.email ilike '%' || search_query || '%'
        or c.full_name ilike '%' || search_query || '%'
        or c.subject ilike '%' || search_query || '%')
  )
  select * from combined
  order by received_at desc
  offset result_offset
  limit result_limit;
end;
$$;

-- ------------------------------------------------------------
-- RPC: count_inbox_items_by_type
-- ------------------------------------------------------------
-- Powers the type-pill counts ("Leads · 12"). Honours the
-- current status filter so counts move with the dropdown.
-- ------------------------------------------------------------
create or replace function public.count_inbox_items_by_type(
  filter_status text default 'all'
)
returns table(
  type text,
  count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  return query
    select 'lead'::text, count(*) from public.leads
      where filter_status = 'all' or status = filter_status
    union all
    select 'demo'::text, count(*) from public.demo_requests
      where filter_status = 'all' or status = filter_status
    union all
    select 'contact'::text, count(*) from public.contact_messages
      where filter_status = 'all' or status = filter_status;
end;
$$;

-- ------------------------------------------------------------
-- RPC: count_inbox_new_items
-- ------------------------------------------------------------
-- Powers the AdminSidebar Inbox badge — sum of status='new'
-- across all three tables. Cached 60s in AdminLayout.
-- ------------------------------------------------------------
create or replace function public.count_inbox_new_items()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  return (
    (select count(*) from public.leads where status = 'new')
    + (select count(*) from public.demo_requests where status = 'new')
    + (select count(*) from public.contact_messages where status = 'new')
  );
end;
$$;
