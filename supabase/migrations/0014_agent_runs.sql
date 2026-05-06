-- ============================================================
-- Precise Aesthetics — AI Agent Runs (Session P11)
-- ============================================================
-- Three units of work:
--
-- 1. agent_runs table + agent_run_status enum — every Anthropic
--    invocation lands a row here with full payload, tokens,
--    cost, latency, errors, and approval state. RLS Class C
--    (admin-only); practitioners never see this surface.
--
-- 2. Two SECURITY DEFINER RPCs:
--      agent_cost_summary(range_start, range_end) — drives
--        /admin/ai/cost dashboard.
--      execute_readonly_query(query_text) — backs Query
--        Assistant. Wraps EXECUTE in a read-only transaction
--        with a 10-second statement timeout. is_admin() gate
--        as the second line of defence behind the route-level
--        regex parser.
--
-- 3. Enrichment columns on contact_messages — P8 added them
--    to leads + demo_requests but skipped contact. P11's Lead
--    Enricher fans out across all three inbound types, so
--    consistency demands the column on contact_messages too.
--
-- ============================================================
-- HOLD: review before applying. Per CLAUDE.md DB safety rules.
-- ============================================================
-- READ CAREFULLY:
--
-- 1. execute_readonly_query() runs ARBITRARY SQL. The is_admin()
--    gate + READ ONLY transaction + statement_timeout are the
--    Postgres-level safety net; the Next.js route handler does
--    a regex pass first to reject INSERT/UPDATE/DELETE/DROP/etc
--    and any reference to auth.* or storage.* schemas. Both
--    layers are non-negotiable.
--
-- 2. agent_cost_summary() filters status='success' so failed
--    runs (which cost nothing — Anthropic only bills on
--    successful completion) don't pollute the dashboard.
--
-- 3. enrichment_data on contact_messages is nullable. Lead
--    Enricher idempotency: if non-null, skip auto-trigger.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Enum + table
-- ------------------------------------------------------------
create type public.agent_run_status as enum (
  'pending',
  'success',
  'failed',
  'cancelled'
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Agent identification
  agent_type text not null check (agent_type in (
    'pattern_analyst',
    'protocol_drafter',
    'practice_health_reviewer',
    'communication_drafter',
    'query_assistant',
    'lead_enricher'
  )),

  -- Trigger context
  triggered_by_user_id uuid references auth.users(id) on delete set null,
  trigger_type text not null check (trigger_type in ('manual', 'auto')),
  trigger_context jsonb,

  -- Anthropic call details
  model text not null,
  system_prompt text,
  user_message text,

  -- Response
  raw_output text,
  parsed_output jsonb,

  -- Tokens + cost (numeric(10,6) covers fractions of a cent up
  -- to ~$10k per run — well past any realistic single call).
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(10, 6),

  -- Status
  status public.agent_run_status not null default 'pending',
  error_message text,
  latency_ms integer,

  -- Replay linkage
  replay_of_id uuid references public.agent_runs(id) on delete set null,

  -- Approval state — applied_action is free-text record of what
  -- Roni did externally (e.g. "Email sent via Outlook",
  -- "Protocol updated to v1.2 in Sanity"). P11 doesn't
  -- auto-mutate Sanity or auto-send email; future polish can.
  approved_at timestamptz,
  approved_by_user_id uuid references auth.users(id) on delete set null,
  applied_action text,
  applied_at timestamptz
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
create index idx_agent_runs_agent_type on public.agent_runs (agent_type);
create index idx_agent_runs_triggered_by on public.agent_runs (triggered_by_user_id);
create index idx_agent_runs_created_at on public.agent_runs (created_at desc);
create index idx_agent_runs_status on public.agent_runs (status);
create index idx_agent_runs_replay_of on public.agent_runs (replay_of_id);

-- ------------------------------------------------------------
-- 2. RLS — admin-only
-- ------------------------------------------------------------
alter table public.agent_runs enable row level security;

create policy agent_runs_admin_all on public.agent_runs
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- 3. RPC: agent_cost_summary
-- ------------------------------------------------------------
-- Drives /admin/ai/cost. Filters status='success' since failed
-- runs aren't billed by Anthropic.
create or replace function public.agent_cost_summary(
  range_start timestamptz,
  range_end timestamptz
)
returns table(
  agent_type text,
  run_count bigint,
  total_input_tokens bigint,
  total_output_tokens bigint,
  total_cost_usd numeric
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
      ar.agent_type,
      count(*)::bigint as run_count,
      coalesce(sum(ar.input_tokens), 0)::bigint as total_input_tokens,
      coalesce(sum(ar.output_tokens), 0)::bigint as total_output_tokens,
      coalesce(sum(ar.cost_usd), 0) as total_cost_usd
    from public.agent_runs ar
    where ar.created_at between range_start and range_end
      and ar.status = 'success'
    group by ar.agent_type
    order by total_cost_usd desc;
end;
$$;

-- ------------------------------------------------------------
-- 4. RPC: execute_readonly_query — Query Assistant SQL exec
-- ------------------------------------------------------------
-- Runs an arbitrary SELECT against the public schema and
-- returns rows as setof json. Three guardrails:
--
--   1. is_admin() check — same gate as the route handler.
--   2. SET LOCAL default_transaction_read_only = on — Postgres
--      blocks any write (raises 25006: read_only_sql_transaction).
--   3. SET LOCAL statement_timeout = '10s' — caps execution
--      time so a runaway query doesn't pin the connection.
--
-- The route handler's regex parser is the FIRST line of defence
-- and rejects writes + auth.*/storage.* references before this
-- function is ever called. Defense-in-depth.
create or replace function public.execute_readonly_query(
  query_text text
)
returns setof json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  -- Read-only enforcement + timeout. SET LOCAL scopes both to
  -- this transaction only.
  set local default_transaction_read_only = on;
  set local statement_timeout = '10s';

  -- Run the dynamic query and stream rows back as json.
  for rec in execute query_text loop
    return next row_to_json(rec);
  end loop;

  return;
end;
$$;

-- ------------------------------------------------------------
-- 5. contact_messages — P11 Lead Enricher consistency
-- ------------------------------------------------------------
-- P8 added enrichment_data + enriched_at to leads and
-- demo_requests but explicitly skipped contact_messages
-- ("contact messages are typically existing customers, not
-- leads"). P11's Lead Enricher fans out across all three
-- inbound types, so we add the columns now for a consistent
-- surface. Idempotency check: if enriched_at is non-null,
-- skip auto-trigger.
alter table public.contact_messages
  add column if not exists enrichment_data jsonb,
  add column if not exists enriched_at timestamptz;
