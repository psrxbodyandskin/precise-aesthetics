-- ============================================================
-- Precise Aesthetics — Audit log viewer RPCs (Session P14)
-- ============================================================
-- Four SECURITY DEFINER RPCs that power /admin/audit-log:
--
--   1. list_audit_log_entries — filtered, paginated list with
--      one-shot joins to auth.users + practices for display
--      names (avoids N+1 lookups in the route).
--   2. count_audit_log_entries — same filter shape; returns
--      bigint for pagination math.
--   3. audit_log_distinct_action_verbs — populates the action
--      filter dropdown, sorted by frequency.
--   4. audit_log_distinct_target_types — populates the target
--      type filter dropdown, sorted by frequency.
--
-- Plus idempotent index creation. Most are already in place from
-- 0004_rls_framework.sql; the `if not exists` guard means re-running
-- this against a freshly-set-up local database (after RLS audit
-- script setup) won't error.
--
-- ============================================================
-- HOLD: review before applying. Per CLAUDE.md DB safety rules.
-- ============================================================
-- READ CAREFULLY:
--
-- 1. Column-name reality vs spec drift: P14 spec assumed columns
--    `actor_user_id`, `actor_type`, `practice_id`. Actual schema
--    (0004_rls_framework.sql) has `actor_id`, `actor_role`, and
--    NO `practice_id` column. These RPCs use the real names.
--    Documented in KNOWN-GOTCHAS.md + lib/admin/audit-log.ts.
--
-- 2. NULL `actor_role` represents service-role actions with no
--    acting user (webhook-triggered audits, scheduled jobs).
--    The UI renders these as "System" — the RPC just returns NULL
--    and the route handler / display layer interprets.
--
-- 3. Practice filter: there is no `practice_id` column. The
--    list_audit_log_entries RPC accepts `filter_practice_id` and
--    matches when `target_type = 'practice' AND target_id =
--    filter_practice_id`. Compliance UI footnote tells the operator
--    this is the matching semantics.
--
-- 4. Every RPC checks public.is_admin() FIRST and raises if false.
--    Defense-in-depth: the API route already requires admin auth,
--    but the RPCs are gated independently in case anyone exposes
--    them through another path.
-- ============================================================

-- ------------------------------------------------------------
-- 1. list_audit_log_entries
-- ------------------------------------------------------------
create or replace function public.list_audit_log_entries(
  filter_actor_id uuid default null,
  filter_actor_role text default null,
  -- Sentinel for "actor_role IS NULL" (system actions). When the
  -- caller wants to filter to system entries specifically, pass
  -- filter_actor_role_is_null = true (filter_actor_role itself
  -- is ignored when this flag is true).
  filter_actor_role_is_null boolean default false,
  filter_action text default null,
  filter_target_type text default null,
  filter_target_id uuid default null,
  -- Practice filter: matches entries where target_type='practice'
  -- AND target_id = filter_practice_id. See HOLD note #3.
  filter_practice_id uuid default null,
  filter_date_from timestamptz default null,
  filter_date_to timestamptz default null,
  search_query text default null,
  result_offset int default 0,
  result_limit int default 50
)
returns table (
  id uuid,
  created_at timestamptz,
  actor_id uuid,
  actor_role text,
  actor_email text,
  action text,
  target_type text,
  target_id uuid,
  metadata jsonb,
  ip_address inet,
  -- When the entry's target_type is 'practice', join the practice
  -- name in for display. Otherwise NULL.
  target_practice_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  return query
    select
      al.id,
      al.created_at,
      al.actor_id,
      al.actor_role,
      au.email as actor_email,
      al.action,
      al.target_type,
      al.target_id,
      al.metadata,
      al.ip_address,
      case
        when al.target_type = 'practice' then p.name
        else null
      end as target_practice_name
    from public.audit_log al
    left join auth.users au on au.id = al.actor_id
    left join public.practices p
      on p.id = al.target_id and al.target_type = 'practice'
    where (filter_actor_id is null or al.actor_id = filter_actor_id)
      and (
        filter_actor_role_is_null = true and al.actor_role is null
        or filter_actor_role_is_null = false and (
          filter_actor_role is null or al.actor_role = filter_actor_role
        )
      )
      and (filter_action is null or al.action = filter_action)
      and (filter_target_type is null or al.target_type = filter_target_type)
      and (filter_target_id is null or al.target_id = filter_target_id)
      and (
        filter_practice_id is null
        or (al.target_type = 'practice' and al.target_id = filter_practice_id)
      )
      and (filter_date_from is null or al.created_at >= filter_date_from)
      and (filter_date_to is null or al.created_at <= filter_date_to)
      and (
        search_query is null
        or al.action ilike '%' || search_query || '%'
        or al.target_type ilike '%' || search_query || '%'
        or au.email ilike '%' || search_query || '%'
        or p.name ilike '%' || search_query || '%'
        or al.metadata::text ilike '%' || search_query || '%'
      )
    order by al.created_at desc
    offset result_offset
    limit result_limit;
end;
$$;

-- ------------------------------------------------------------
-- 2. count_audit_log_entries
-- ------------------------------------------------------------
create or replace function public.count_audit_log_entries(
  filter_actor_id uuid default null,
  filter_actor_role text default null,
  filter_actor_role_is_null boolean default false,
  filter_action text default null,
  filter_target_type text default null,
  filter_target_id uuid default null,
  filter_practice_id uuid default null,
  filter_date_from timestamptz default null,
  filter_date_to timestamptz default null,
  search_query text default null
)
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  count_val bigint;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  select count(*) into count_val
  from public.audit_log al
  left join auth.users au on au.id = al.actor_id
  left join public.practices p
    on p.id = al.target_id and al.target_type = 'practice'
  where (filter_actor_id is null or al.actor_id = filter_actor_id)
    and (
      filter_actor_role_is_null = true and al.actor_role is null
      or filter_actor_role_is_null = false and (
        filter_actor_role is null or al.actor_role = filter_actor_role
      )
    )
    and (filter_action is null or al.action = filter_action)
    and (filter_target_type is null or al.target_type = filter_target_type)
    and (filter_target_id is null or al.target_id = filter_target_id)
    and (
      filter_practice_id is null
      or (al.target_type = 'practice' and al.target_id = filter_practice_id)
    )
    and (filter_date_from is null or al.created_at >= filter_date_from)
    and (filter_date_to is null or al.created_at <= filter_date_to)
    and (
      search_query is null
      or al.action ilike '%' || search_query || '%'
      or al.target_type ilike '%' || search_query || '%'
      or au.email ilike '%' || search_query || '%'
      or p.name ilike '%' || search_query || '%'
      or al.metadata::text ilike '%' || search_query || '%'
    );

  return count_val;
end;
$$;

-- ------------------------------------------------------------
-- 3. audit_log_distinct_action_verbs
-- ------------------------------------------------------------
create or replace function public.audit_log_distinct_action_verbs()
returns table (
  action text,
  occurrences bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  return query
    select al.action, count(*)::bigint as occurrences
    from public.audit_log al
    group by al.action
    order by occurrences desc, al.action asc;
end;
$$;

-- ------------------------------------------------------------
-- 4. audit_log_distinct_target_types
-- ------------------------------------------------------------
create or replace function public.audit_log_distinct_target_types()
returns table (
  target_type text,
  occurrences bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  return query
    select al.target_type, count(*)::bigint as occurrences
    from public.audit_log al
    where al.target_type is not null
    group by al.target_type
    order by occurrences desc, al.target_type asc;
end;
$$;

-- ------------------------------------------------------------
-- 5. Performance indexes (idempotent — most exist from 0004)
-- ------------------------------------------------------------
-- 0004 already created:
--   idx_audit_log_created_at (created_at desc)
--   idx_audit_log_actor (actor_id, created_at desc)
--   idx_audit_log_target (target_type, target_id, created_at desc)
--   idx_audit_log_action (action, created_at desc)
--
-- This block is defensive — re-running this migration against a
-- fresh local Supabase setup that pulled schema from a different
-- source would still get the indexes.
create index if not exists idx_audit_log_created_at_desc
  on public.audit_log (created_at desc);
create index if not exists idx_audit_log_actor_role
  on public.audit_log (actor_role);
