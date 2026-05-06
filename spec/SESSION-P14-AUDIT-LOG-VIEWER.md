# Session P14 — Audit Log Viewer

> Run after P13 (Admin Utilities) is deployed. Builds the admin-facing audit log viewer that surfaces the audit_log data captured throughout P1-P13. Read-only filtered list, detail view, CSV export. Compliance + investigation tool.

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/PORTAL-MASTER-SPEC.md`
6. `spec/RLS-PATTERNS.md`
7. `spec/SESSION-P8-INBOX.md` (similar filter + list pattern)
8. `spec/SESSION-P11-AI-AGENTS.md` (`/admin/ai/runs` is the closest existing pattern — read-only filtered list with detail drill-down)
9. This spec

---

## The Use Case

A practice asks: "did Roni see my adverse event before her response?"

Today: you have to query Supabase directly to find the relevant `audit_log` row. Slow, error-prone, requires SQL knowledge.

P14: Roni or you visit `/admin/audit-log`, filter by target_type='adverse_event' and target_id=the-id, see the timeline.

This is the compliance + investigation tool clinical software needs. The data has been collecting since launch — this session makes it useful.

---

## Goal

After this session:
- `/admin/audit-log` — filterable list view of every audit_log entry
- Detail view per entry showing full metadata JSON
- Filters: actor (admin user / practice user), action verb, target type, target id, date range, search
- CSV export of filtered results
- AdminSidebar updated with "Audit log" entry
- All read-only — no mutations from this UI

---

## What Gets Built

### Database
- No new tables — uses existing `audit_log`
- One new RPC: `list_audit_log_entries` for efficient filtered queries (avoids N+1 joins for actor names)
- One new RPC: `audit_log_distinct_action_verbs` for filter dropdown population
- Migration `0016_audit_log_rpcs.sql`

### Admin UI
- `/admin/audit-log` — list view
- `/admin/audit-log/[id]` — detail view (full metadata)
- Sidebar entry between "Stack" and "AI" section divider

### API routes
- `GET /api/admin/audit-log` — filtered list
- `GET /api/admin/audit-log/[id]` — single entry
- `GET /api/admin/audit-log/export` — CSV download of filtered set

### Components
- AuditLogList (server)
- AuditLogFilterBar (client)
- AuditLogRow + AuditLogCard (server)
- AuditLogDetailView (server)
- AuditLogMetadataDisplay (server — pretty-prints JSON)
- ExportCsvButton (client)

---

## Critical Constraints

1. **Build on P1-P13 foundation.** Use `requireAdmin()`, RLS Class C, no audit log writes (this is read-only).
2. **MASTER.md tokens only.** No new colors, fonts, icons.
3. **Read-only.** No editing, no deletion of audit entries. The audit_log table is append-only by RLS.
4. **Performance matters.** Audit log will grow large over time — paginate, index, avoid full-table scans.
5. **CSV export server-side.** Don't pull all rows to client and stringify. Generate CSV on server, stream response.
6. **All migrations held for manual review.**
7. **Mobile-friendly.** Roni reviews from her phone occasionally.

---

# DATA MODEL

The `audit_log` table already exists (created in P1). Schema reference:

```sql
-- Already exists, NOT created in this migration:
audit_log (
  id uuid primary key,
  created_at timestamptz,
  actor_user_id uuid references auth.users(id),  -- who did it
  actor_type text,                                -- 'admin' | 'practice' | 'system'
  practice_id uuid,                               -- if practice context
  action text not null,                           -- verb like 'practice.created'
  target_type text,                               -- e.g. 'practice', 'protocol', 'treatment'
  target_id uuid,                                 -- specific record affected
  metadata jsonb                                  -- structured context data
)
```

## Migration: `0016_audit_log_rpcs.sql`

```sql
-- RPC: list audit log entries with joins for display names
-- Avoids N+1 lookups by joining auth.users + practices in a single query

create or replace function public.list_audit_log_entries(
  filter_actor_user_id uuid default null,
  filter_actor_type text default null,
  filter_action text default null,
  filter_target_type text default null,
  filter_target_id uuid default null,
  filter_practice_id uuid default null,
  filter_date_from timestamptz default null,
  filter_date_to timestamptz default null,
  search_query text default null,
  result_offset int default 0,
  result_limit int default 50
)
returns table(
  id uuid,
  created_at timestamptz,
  actor_user_id uuid,
  actor_type text,
  actor_email text,
  practice_id uuid,
  practice_name text,
  action text,
  target_type text,
  target_id uuid,
  metadata jsonb
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
    select
      al.id,
      al.created_at,
      al.actor_user_id,
      al.actor_type,
      au.email as actor_email,
      al.practice_id,
      p.practice_name as practice_name,
      al.action,
      al.target_type,
      al.target_id,
      al.metadata
    from public.audit_log al
    left join auth.users au on au.id = al.actor_user_id
    left join public.practices p on p.id = al.practice_id
    where (filter_actor_user_id is null or al.actor_user_id = filter_actor_user_id)
      and (filter_actor_type is null or al.actor_type = filter_actor_type)
      and (filter_action is null or al.action = filter_action)
      and (filter_target_type is null or al.target_type = filter_target_type)
      and (filter_target_id is null or al.target_id = filter_target_id)
      and (filter_practice_id is null or al.practice_id = filter_practice_id)
      and (filter_date_from is null or al.created_at >= filter_date_from)
      and (filter_date_to is null or al.created_at <= filter_date_to)
      and (search_query is null
        or al.action ilike '%' || search_query || '%'
        or al.target_type ilike '%' || search_query || '%'
        or au.email ilike '%' || search_query || '%'
        or p.practice_name ilike '%' || search_query || '%'
        or al.metadata::text ilike '%' || search_query || '%')
    order by al.created_at desc
    offset result_offset
    limit result_limit;
end;
$$;

-- RPC: count filtered entries (for pagination)
create or replace function public.count_audit_log_entries(
  filter_actor_user_id uuid default null,
  filter_actor_type text default null,
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
  left join auth.users au on au.id = al.actor_user_id
  left join public.practices p on p.id = al.practice_id
  where (filter_actor_user_id is null or al.actor_user_id = filter_actor_user_id)
    and (filter_actor_type is null or al.actor_type = filter_actor_type)
    and (filter_action is null or al.action = filter_action)
    and (filter_target_type is null or al.target_type = filter_target_type)
    and (filter_target_id is null or al.target_id = filter_target_id)
    and (filter_practice_id is null or al.practice_id = filter_practice_id)
    and (filter_date_from is null or al.created_at >= filter_date_from)
    and (filter_date_to is null or al.created_at <= filter_date_to)
    and (search_query is null
      or al.action ilike '%' || search_query || '%'
      or al.target_type ilike '%' || search_query || '%'
      or au.email ilike '%' || search_query || '%'
      or p.practice_name ilike '%' || search_query || '%'
      or al.metadata::text ilike '%' || search_query || '%');
  
  return count_val;
end;
$$;

-- RPC: distinct action verbs for filter dropdown
create or replace function public.audit_log_distinct_action_verbs()
returns table(action text, count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;
  
  return query
    select al.action, count(*)::bigint
    from public.audit_log al
    group by al.action
    order by count(*) desc;
end;
$$;

-- RPC: distinct target types
create or replace function public.audit_log_distinct_target_types()
returns table(target_type text, count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;
  
  return query
    select al.target_type, count(*)::bigint
    from public.audit_log al
    where al.target_type is not null
    group by al.target_type
    order by count(*) desc;
end;
$$;

-- Performance index (in case it's missing from earlier migrations)
create index if not exists idx_audit_log_created_at on public.audit_log(created_at desc);
create index if not exists idx_audit_log_actor_user_id on public.audit_log(actor_user_id);
create index if not exists idx_audit_log_practice_id on public.audit_log(practice_id);
create index if not exists idx_audit_log_action on public.audit_log(action);
create index if not exists idx_audit_log_target on public.audit_log(target_type, target_id);
```

---

# UI — `/admin/audit-log`

## Page header

```
Eyebrow: § ADMIN
H1: Audit log.
Lead: Every meaningful action across the system. Filter and inspect for compliance, investigation, and operational review.
Action: "Export CSV" (top-right, exports filtered set)
```

## Filter bar (sticky)

Two rows on mobile, one row on desktop:

**Row 1:**
- Search input (placeholder: "Search action, target, actor, or metadata")
- Date range picker (from / to)

**Row 2:**
- Actor type dropdown: All / Admin / Practice / System
- Action verb dropdown (multi-select, populated from `audit_log_distinct_action_verbs()` RPC, sorted by frequency)
- Target type dropdown (multi-select, populated from `audit_log_distinct_target_types()` RPC)
- Practice dropdown (multi-select, populated from active practices — small list at launch)

**Clear filters** link visible when any filter is active.

URL state for all filters (bookmarkable, shareable).

## Results display

### Desktop (table)

Columns:
- Timestamp (relative + absolute on hover)
- Actor (email + actor_type chip)
- Action (verb chip with category color)
- Target (type + id, click to filter to this target)
- Practice (if applicable, click to filter)
- Metadata preview (truncated JSON, expand on click)

Click row → `/admin/audit-log/[id]` for full detail.

### Mobile (cards)

Each card:
```
[Action verb chip]              2h ago
sarah@admin.com (Admin)
Target: practice · Sterling Aesthetic
{"status_changed": "active"}
```

Tap card → detail view.

### Action verb color coding

Color treatment per category prefix:
- `*.created` → ink-900 (creation events)
- `*.updated` / `*.changed` → brand-700 (modification events)
- `*.deleted` / `*.archived` → ink-500 (removal events)
- `*.published` / `*.publish` → brand-300 (publish events)
- `agent_run.*` → ink-700 (AI events, distinct visual register)
- `auth.*` → error-700 (auth events get attention)
- everything else → ink-700 default

This helps Roni scan the timeline visually.

## Empty states

- No entries match filters: "No audit log entries match these filters. Try clearing one or more filters."
- No entries at all (impossible at launch since P1+ wrote them): "No audit log entries yet."

## Pagination

- Default 50 per page
- Numbered pages on desktop
- Prev/Next + "X of Y" on mobile
- Total count visible: "Showing 50 of 12,847 entries"

---

# UI — `/admin/audit-log/[id]`

## Layout

Page header:
- Breadcrumb: `Audit log › {action verb} · {timestamp}`
- Eyebrow: `§ AUDIT ENTRY`
- H1: action verb (Fraunces, large)
- Sub-line: timestamp + actor email + target

Body sections:

**Section A — Event**
- Action verb (full text, no truncation)
- Timestamp (full ISO + relative)
- Actor email + actor_type
- Practice context (if applicable)

**Section B — Target**
- Target type
- Target id
- Click target id to filter audit log to this target's full history
- "View target" link if applicable (links to /admin/practices/[id], /admin/protocols/[id], etc. based on target_type)

**Section C — Metadata**
- Pretty-printed JSON
- Syntax-highlighted (if simple highlighter available; otherwise plain monospace)
- Copy-to-clipboard button

**Section D — Related entries**
- Other audit_log entries for the same target_id (if target exists)
- Limited to 10, ordered by created_at desc
- "View all entries for this target" link → filters list to this target_id

**Section E — Raw record**
- The full raw audit_log row (for true compliance review)
- Collapsed by default, expand on click

---

# DATA LAYER

## `lib/admin/audit-log.ts`

```typescript
import "server-only";
import { getServiceClient } from "@/lib/supabase/server-auth";

export interface AuditLogFilters {
  actorUserId?: string;
  actorType?: 'admin' | 'practice' | 'system';
  action?: string;
  targetType?: string;
  targetId?: string;
  practiceId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorType: string | null;
  actorEmail: string | null;
  practiceId: string | null;
  practiceName: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, any> | null;
}

export async function listAuditLogEntries(filters: AuditLogFilters): 
  Promise<{ entries: AuditLogEntry[]; total: number }>;

export async function getAuditLogEntryById(id: string): Promise<AuditLogEntry | null>;

export async function getRelatedEntriesForTarget(
  targetType: string, 
  targetId: string, 
  limit: number = 10
): Promise<AuditLogEntry[]>;

export async function getDistinctActionVerbs(): 
  Promise<Array<{ action: string; count: number }>>;

export async function getDistinctTargetTypes(): 
  Promise<Array<{ targetType: string; count: number }>>;

export async function exportAuditLogToCsv(filters: AuditLogFilters): 
  Promise<string>; // returns CSV content
```

## CSV export implementation

Server-side CSV generation. For each row, output columns:
- Timestamp (ISO)
- Actor email
- Actor type
- Practice name
- Action
- Target type
- Target id
- Metadata (JSON.stringify, escaped for CSV)

Stream response — set `Content-Disposition: attachment; filename="audit-log-{date}.csv"` + `Content-Type: text/csv`.

Cap export at 10,000 rows to prevent runaway exports. Return error message if filter set yields more than 10k.

---

# COMPONENTS

```
components/admin/audit-log/
├── AuditLogList.tsx              (server — table desktop, cards mobile)
├── AuditLogRow.tsx               (server — desktop row)
├── AuditLogCard.tsx              (server — mobile card)
├── AuditLogFilterBar.tsx         (client — sticky filter bar)
├── AuditLogActionChip.tsx        (server — color-coded verb chip)
├── AuditLogActorChip.tsx         (server — actor type indicator)
├── AuditLogMetadataPreview.tsx   (server — truncated JSON inline)
├── AuditLogMetadataDisplay.tsx   (server — pretty-printed JSON full)
├── AuditLogDetailView.tsx        (server — wraps detail sections)
├── AuditLogRelatedEntries.tsx    (server — same-target history)
├── AuditLogPagination.tsx        (client — pagination controls)
├── EmptyAuditLogState.tsx        (server)
└── ExportCsvButton.tsx           (client — triggers download)
```

---

# API ROUTES

All under `/api/admin/audit-log/*`, all `requireAdmin()`:

- `GET /api/admin/audit-log?[filters]` — list
- `GET /api/admin/audit-log/[id]` — single entry
- `GET /api/admin/audit-log/export?[filters]` — CSV download
- `GET /api/admin/audit-log/distinct/action-verbs` — for filter dropdown
- `GET /api/admin/audit-log/distinct/target-types` — for filter dropdown

---

# ADMIN SIDEBAR UPDATE

`AdminSidebar.tsx` NAV_ITEMS — add "Audit log" between "Stack" and the AI section divider:

```
1. Dashboard
2. Practices
3. Inbox
4. Adverse Events
5. Protocols
6. Training
7. Vendors
8. Stack
9. Audit log         (NEW)
─── AI ───
Query / Runs / Cost
```

---

# VERIFICATION

Before declaring done:

1. `npm run build` clean
2. `npx tsc --noEmit` clean
3. `npm run lint` clean (no new errors beyond the 18 deferred to P12.5)
4. Migration written, NOT applied
5. Manual test sequence (after migration applied):
   - Sign in as admin
   - Visit `/admin/audit-log` → see all entries from P1-P13 activity
   - Apply filters one at a time:
     - Search by email → results filter
     - Date range → results constrain
     - Actor type → results constrain
     - Action verb dropdown → loads from RPC, filters work
     - Target type dropdown → loads from RPC, filters work
   - URL updates with each filter change
   - Refresh page → filters persist from URL
   - Click "Clear filters" → resets
   - Click an entry row → detail view renders
   - Detail view: target_id click → filters list to that target's history
   - Related entries section shows other entries for same target
   - Click "Export CSV" with filters applied → CSV downloads with correct rows
   - Try exporting >10k rows → error message shown
   - Mobile (375px): filter bar wraps, list renders as cards, all usable
6. RLS verification:
   - Practice user attempting `/admin/audit-log` → blocked
   - Practice user attempting `/api/admin/audit-log` → 403
   - All RPCs check `is_admin()` first
7. Performance:
   - Page load < 1s with 1000+ entries
   - Filter changes responsive
   - No N+1 queries (verify via Supabase logs)
   - CSV export of 1000 rows < 3s

---

# PRE-DELIVERY CHECKLIST

- [ ] Tokens-only, no new colors/fonts/icons
- [ ] All migrations held for manual review
- [ ] Read-only — no mutations from this UI
- [ ] All RPCs check `is_admin()` first
- [ ] CSV export capped at 10k rows
- [ ] Performance indexes in place on audit_log
- [ ] URL state persistence for filters
- [ ] Empty states handled
- [ ] Mobile responsive
- [ ] Reduced motion respected
- [ ] All copy [DRAFT]-marked

---

# DELIVERABLES

When done, report:
1. Production preview URL `/admin/audit-log`
2. Lighthouse scores
3. Migration SQL location (held)
4. Components built
5. RLS verification confirmation
6. Performance test results (page load, query times via Supabase logs)
7. CSV export verification (download works, format correct, cap enforced)
8. Mobile/iPad responsive test results
9. Decisions made not explicit in spec
10. Anything to verify before P12.5

After P14 is approved + migration applied + manual tests pass, P12.5 polish pass runs autonomously, then we hit the launch ritual.
