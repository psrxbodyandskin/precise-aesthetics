-- ============================================================
-- Precise Aesthetics — Notifications (Session P10)
-- ============================================================
-- Three tables forming the unified notification system:
--
--   notifications              — every dispatched event row,
--                                scoped to one recipient (practice
--                                OR admin user). Idempotency via
--                                deterministic event_id.
--   notification_preferences   — per-recipient toggles + quiet
--                                hours. Mandatory categories
--                                bypass these on dispatch.
--   notification_dispatch_log  — append-only ledger of every
--                                channel attempt (in_app + email),
--                                with status + Resend message id.
--
-- Two SECURITY DEFINER RPCs for unread badge + bulk mark-read.
--
-- Idempotency strategy:
--   - Two partial unique indexes scoped on recipient_type:
--     practice rows are unique on (practice_id, event_id);
--     admin rows are unique on (admin_user_id, event_id).
--   - Partials avoid NULL semantics on a single composite unique
--     and let dispatch.ts catch SQLSTATE 23505 cleanly for both.
--
-- ============================================================
-- HOLD: review before applying. Per CLAUDE.md DB safety rules.
-- ============================================================
-- READING ORDER:
--   1. tables (in dependency order)
--   2. indexes (including partial unique idempotency keys)
--   3. updated_at trigger (reuses public.set_updated_at from 0001)
--   4. RLS enable + policies
--   5. RPCs for the bell + bulk mark-read
-- ============================================================

-- ------------------------------------------------------------
-- 1. notifications
-- ------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  recipient_type text not null
    check (recipient_type in ('practice', 'admin')),

  -- Exactly one of practice_id / admin_user_id is non-null per
  -- row (enforced by row-level CHECK below). Cascades clean up
  -- orphaned rows if a practice or admin user is removed.
  practice_id uuid references public.practices(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete cascade,
  practice_user_id uuid
    references public.practice_authorized_users(id) on delete set null,

  category text not null,

  title text not null,
  body text,
  link_path text,
  metadata jsonb,

  read_at timestamptz,

  -- Deterministic event identifier; dispatch.ts builds it per
  -- category (e.g.
  --   protocol.updated.<protocol_id>.<version>.practice.<practice_id>
  --   adverse_event.new.<treatment_adverse_event_id>
  -- ) so duplicate hooks de-dupe at insert time.
  event_id text not null,

  constraint notifications_recipient_consistent check (
    (recipient_type = 'practice' and practice_id is not null and admin_user_id is null)
    or
    (recipient_type = 'admin' and admin_user_id is not null and practice_id is null)
  )
);

-- ------------------------------------------------------------
-- 2. notification_preferences
-- ------------------------------------------------------------
create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  user_type text not null check (user_type in ('practice', 'admin')),
  practice_id uuid references public.practices(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete cascade,

  -- jsonb shape per category:
  --   { "category.name": { "in_app": bool, "email": bool }, ... }
  -- Missing keys default to true at the dispatch layer.
  preferences jsonb not null default '{}'::jsonb,

  quiet_hours_start time,
  quiet_hours_end time,
  quiet_hours_timezone text default 'America/Chicago',

  constraint notification_preferences_recipient_consistent check (
    (user_type = 'practice' and practice_id is not null and admin_user_id is null)
    or
    (user_type = 'admin' and admin_user_id is not null and practice_id is null)
  )
);

-- ------------------------------------------------------------
-- 3. notification_dispatch_log (append-only)
-- ------------------------------------------------------------
create table public.notification_dispatch_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  notification_id uuid
    references public.notifications(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'email')),
  status text not null check (status in (
    'sent', 'failed', 'skipped_preference', 'skipped_quiet_hours'
  )),

  resend_message_id text,
  error_message text
);

-- ------------------------------------------------------------
-- Idempotency: partial unique indexes per recipient_type
-- ------------------------------------------------------------
create unique index idx_notifications_practice_event_id
  on public.notifications (practice_id, event_id)
  where recipient_type = 'practice';

create unique index idx_notifications_admin_event_id
  on public.notifications (admin_user_id, event_id)
  where recipient_type = 'admin';

-- ------------------------------------------------------------
-- Hot-path indexes
-- ------------------------------------------------------------
-- Bell badge (unread count) — one partial index per recipient
-- so the count query stays a fast index scan even at scale.
create index idx_notifications_practice_unread
  on public.notifications (practice_id)
  where recipient_type = 'practice' and read_at is null;

create index idx_notifications_admin_unread
  on public.notifications (admin_user_id)
  where recipient_type = 'admin' and read_at is null;

create index idx_notifications_created_at
  on public.notifications (created_at desc);

create index idx_notifications_category
  on public.notifications (category);

-- Preferences: one row per recipient.
create unique index idx_notification_preferences_practice
  on public.notification_preferences (practice_id)
  where user_type = 'practice';

create unique index idx_notification_preferences_admin
  on public.notification_preferences (admin_user_id)
  where user_type = 'admin';

-- Dispatch log
create index idx_dispatch_log_notification_id
  on public.notification_dispatch_log (notification_id);

create index idx_dispatch_log_created_at
  on public.notification_dispatch_log (created_at desc);

-- ------------------------------------------------------------
-- updated_at trigger (reuses public.set_updated_at from 0001)
-- ------------------------------------------------------------
create trigger trg_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row-Level Security
-- ============================================================

-- ------------------------------------------------------------
-- notifications — Class A: recipient owns
-- ------------------------------------------------------------
alter table public.notifications enable row level security;

create policy notifications_admin_all on public.notifications
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy notifications_practice_read_own on public.notifications
  for select
  using (
    public.is_practice()
    and recipient_type = 'practice'
    and practice_id = public.current_practice_id()
  );

create policy notifications_practice_update_own on public.notifications
  for update
  using (
    public.is_practice()
    and recipient_type = 'practice'
    and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice()
    and recipient_type = 'practice'
    and practice_id = public.current_practice_id()
  );

-- ------------------------------------------------------------
-- notification_preferences — recipient CRUDs own
-- ------------------------------------------------------------
alter table public.notification_preferences enable row level security;

create policy notification_preferences_admin_all
  on public.notification_preferences
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy notification_preferences_practice_crud_own
  on public.notification_preferences
  for all
  using (
    public.is_practice()
    and user_type = 'practice'
    and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice()
    and user_type = 'practice'
    and practice_id = public.current_practice_id()
  );

create policy notification_preferences_admin_crud_own
  on public.notification_preferences
  for all
  using (
    public.is_admin()
    and user_type = 'admin'
    and admin_user_id = auth.uid()
  )
  with check (
    public.is_admin()
    and user_type = 'admin'
    and admin_user_id = auth.uid()
  );

-- ------------------------------------------------------------
-- notification_dispatch_log — admin-readable, system-written
-- ------------------------------------------------------------
alter table public.notification_dispatch_log enable row level security;

create policy dispatch_log_admin_all on public.notification_dispatch_log
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- RPCs
-- ============================================================

-- ------------------------------------------------------------
-- get_unread_notification_count — bell badge endpoint backing.
-- Works for both practice + admin sessions; returns 0 when
-- the JWT has no role claim.
-- ------------------------------------------------------------
create or replace function public.get_unread_notification_count()
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  count_val integer := 0;
begin
  if public.is_practice() then
    select count(*) into count_val
    from public.notifications
    where recipient_type = 'practice'
      and practice_id = public.current_practice_id()
      and read_at is null;
  elsif public.is_admin() then
    select count(*) into count_val
    from public.notifications
    where recipient_type = 'admin'
      and admin_user_id = auth.uid()
      and read_at is null;
  end if;
  return count_val;
end;
$$;

-- ------------------------------------------------------------
-- mark_all_notifications_read — bulk action from the bell
-- panel + the full list page.
-- ------------------------------------------------------------
create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_practice() then
    update public.notifications
    set read_at = now()
    where recipient_type = 'practice'
      and practice_id = public.current_practice_id()
      and read_at is null;
  elsif public.is_admin() then
    update public.notifications
    set read_at = now()
    where recipient_type = 'admin'
      and admin_user_id = auth.uid()
      and read_at is null;
  end if;
end;
$$;
