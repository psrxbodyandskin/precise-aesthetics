-- ============================================================
-- Precise Aesthetics — Protocol Library (Session P4)
-- ============================================================
-- Sanity is the source of truth for protocol content. This
-- schema is the queryable Supabase mirror, written by the
-- Sanity webhook in /api/webhooks/sanity/protocol on publish/
-- unpublish events.
--
-- Naming note: the Sanity document type is `indication`. The
-- Supabase table is `indication_categories` to avoid confusion
-- with future per-document indication fields. lib/sanity/protocols.ts
-- documents this mapping.
--
-- Sync flow:
--   Sanity protocol publish → webhook → upsert protocols row,
--   increment version, append protocol_versions snapshot.
--   Sanity indication publish → webhook → upsert indication_categories.
--
-- Treatment logs (P6+) reference specific protocol_versions
-- snapshots — the versions table is append-only at the policy
-- layer to preserve reference integrity.
--
-- Ordering: tables → indexes → triggers → enable RLS → policies.
-- The cross-table policies (protocols read: practice device-gated,
-- protocol_versions read: practice device-gated) reference
-- protocol_devices, so all tables must exist before any policy
-- runs.
-- ============================================================
-- HOLD: review before applying to production Supabase. Per
-- CLAUDE.md database safety rules — never run automatically.
-- ============================================================

-- ------------------------------------------------------------
-- Tables (in dependency order)
-- ------------------------------------------------------------

create table public.indication_categories (
  id uuid primary key default gen_random_uuid(),
  sanity_id text unique not null,
  sanity_rev text,                              -- last-synced _rev for idempotency

  title text not null,
  slug text not null unique,
  short_description text,
  sort_order integer default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  sanity_id text unique not null,
  sanity_rev text,                              -- last-synced _rev for idempotency

  title text not null,
  slug text not null unique,
  short_description text,
  indication_category_id uuid references public.indication_categories(id),
  indication_tags text[] not null default '{}',
  fitzpatrick_types text[] not null default '{}',

  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  current_version text,                          -- '1.0', '1.1', '2.0'
  pending_major_bump boolean not null default false,
  last_published_at timestamptz,
  last_published_by uuid references auth.users(id),
  last_synced_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.protocol_devices (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  device_id uuid not null references public.devices(id),
  created_at timestamptz not null default now(),
  unique(protocol_id, device_id)
);

create table public.protocol_versions (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  version text not null,                         -- '1.0', '1.1', '2.0'

  title text not null,
  short_description text,
  indication_category_sanity_id text,
  indication_tags text[] not null default '{}',
  fitzpatrick_types text[] not null default '{}',

  -- Full Sanity payload at the moment of publish (rich text, parameters,
  -- supporting docs metadata, etc.). Treatment logs read from this.
  sanity_snapshot jsonb not null,

  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id),

  unique(protocol_id, version)
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------

create index idx_indication_categories_sort_order
  on public.indication_categories(sort_order);

create index idx_protocols_status on public.protocols(status);
create index idx_protocols_indication_category on public.protocols(indication_category_id);
create index idx_protocols_indication_tags on public.protocols using gin(indication_tags);
create index idx_protocols_fitzpatrick_types on public.protocols using gin(fitzpatrick_types);
create index idx_protocols_sanity_id on public.protocols(sanity_id);
create index idx_protocols_pending_major_bump
  on public.protocols(pending_major_bump)
  where pending_major_bump = true;

create index idx_protocol_devices_protocol_id on public.protocol_devices(protocol_id);
create index idx_protocol_devices_device_id on public.protocol_devices(device_id);

create index idx_protocol_versions_protocol_id
  on public.protocol_versions(protocol_id);
create index idx_protocol_versions_published_at
  on public.protocol_versions(published_at desc);

-- ------------------------------------------------------------
-- updated_at triggers
-- ------------------------------------------------------------

create trigger trg_indication_categories_updated_at
  before update on public.indication_categories
  for each row execute function public.set_updated_at();

create trigger trg_protocols_updated_at
  before update on public.protocols
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Enable RLS
-- ------------------------------------------------------------

alter table public.indication_categories enable row level security;
alter table public.protocols enable row level security;
alter table public.protocol_devices enable row level security;
alter table public.protocol_versions enable row level security;

-- ------------------------------------------------------------
-- Policies (cross-table refs are now safe — all tables exist)
-- ------------------------------------------------------------

create policy "indication_categories admin all"
  on public.indication_categories for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "indication_categories read: practice"
  on public.indication_categories for select
  using (public.is_practice());

create policy "protocols admin all"
  on public.protocols for all
  using (public.is_admin())
  with check (public.is_admin());

-- Practice can only see published protocols whose tagged devices
-- intersect with the practice's owned devices.
create policy "protocols read: practice device-gated"
  on public.protocols for select
  using (
    public.is_practice()
    and status = 'published'
    and exists (
      select 1
      from public.protocol_devices pd
      join public.practice_devices prd on prd.device_id = pd.device_id
      where pd.protocol_id = protocols.id
        and prd.practice_id = public.current_practice_id()
    )
  );

create policy "protocol_devices admin all"
  on public.protocol_devices for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "protocol_devices read: practice"
  on public.protocol_devices for select
  using (
    public.is_practice()
    and exists (
      select 1
      from public.practice_devices prd
      where prd.device_id = protocol_devices.device_id
        and prd.practice_id = public.current_practice_id()
    )
  );

-- Append-only at the policy layer. Admin gets explicit SELECT and
-- INSERT only — no UPDATE or DELETE policy means RLS denies those
-- ops for authenticated users (service role still bypasses RLS for
-- system-level repair if ever needed). Treatment-log integrity in
-- P6+ depends on these snapshots never mutating.
create policy "protocol_versions read: admin"
  on public.protocol_versions for select
  using (public.is_admin());

create policy "protocol_versions insert: admin"
  on public.protocol_versions for insert
  with check (public.is_admin());

-- Belt-and-suspenders explicit denials. Redundant against the
-- absence of admin update/delete policies, but they make the
-- append-only intent loud for future readers and block any policy
-- regression from accidentally re-enabling these ops.
create policy "protocol_versions no_update"
  on public.protocol_versions for update
  using (false);

create policy "protocol_versions no_delete"
  on public.protocol_versions for delete
  using (false);

create policy "protocol_versions read: practice device-gated"
  on public.protocol_versions for select
  using (
    public.is_practice()
    and exists (
      select 1
      from public.protocols p
      where p.id = protocol_versions.protocol_id
        and p.status = 'published'
        and exists (
          select 1
          from public.protocol_devices pd
          join public.practice_devices prd on prd.device_id = pd.device_id
          where pd.protocol_id = p.id
            and prd.practice_id = public.current_practice_id()
        )
    )
  );
