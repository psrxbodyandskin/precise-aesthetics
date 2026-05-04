# Session P8 — Lead / Demo / Contact Inbox (Admin)

> Run after P7 (Treatment History + Admin Dashboard) is deployed and confirmed working. Builds the unified admin inbox for managing all inbound from the marketing site: lead captures, demo requests, contact messages.

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/PORTAL-MASTER-SPEC.md`
6. `spec/RLS-PATTERNS.md`
7. `spec/SESSION-P7-TREATMENT-HISTORY-DASHBOARD.md` (for admin dashboard pattern reference)
8. This spec

---

## The Use Case

Lead came in from the homepage. Demo request came in from /demo. Contact form came in from /contact. Right now they all write to Supabase but nobody manages them — you'd be querying Supabase directly to see who reached out.

This session builds the inbox that turns inbound traffic into a managed pipeline. Roni and you sign in, see what's new, work through the queue, track conversions.

---

## Goal

After this session:
- Single unified inbox at `/admin/inbox`
- Three existing tables (`lead_captures`, `demo_requests`, `contact_messages`) surfaced in one view
- Quick filter pills: All · Leads · Demo Requests · Contact Messages
- Four-state status workflow per item: new → contacted → qualified → closed
- Detail view per item with full submission context
- Status changes audit-logged
- "Lead Enricher" AI agent integration point reserved for P11 (data structure ready, no AI calls yet)
- Notification badge on AdminSidebar showing count of `status='new'` items
- Filtering, search, pagination
- Read + manage only — no creating leads from inside the inbox

---

## What Gets Built

### Database
- Add `status` + `status_changed_at` + `status_changed_by` + `admin_notes` columns to all three existing inbound tables (lead_captures, demo_requests, contact_messages)
- Add `enrichment_data jsonb` + `enriched_at` columns (reserved for P11 Lead Enricher AI agent)
- Migration `0010_inbox_status.sql`

### Admin UI
- `/admin/inbox` — unified list view with type pills, status filter, search
- `/admin/inbox/[type]/[id]` — detail view per item type (lead/demo/contact)
- AdminSidebar updated: "Inbox" entry between "Practices" and "Adverse Events", with badge count

### API routes
- `GET /api/admin/inbox` — unified list with filters
- `GET /api/admin/inbox/[type]/[id]` — single item detail
- `PATCH /api/admin/inbox/[type]/[id]` — update status + admin notes

### Components
- Inbox list view with type pills, status filter, search
- Inbox row component (handles all three types via discriminated union)
- Detail view per type (lead / demo / contact — different field shapes)
- Status workflow control (current status + advance/revert buttons + dropdown for direct selection)

---

## Critical Constraints

1. **Build on P1-P7 foundation.** Use `requireAdmin()`, RLS Class C (admin-only), audit log via `logAudit()`.
2. **MASTER.md tokens only.** No new colors, fonts, icons.
3. **All three existing tables stay distinct.** Don't merge into a single inbound table — they have different shapes. The inbox UI unifies the *view*, not the storage.
4. **Status workflow is shared semantics across all three types.** Same four states (new / contacted / qualified / closed) with same color treatment.
5. **All migrations held for manual review.**
6. **Read + manage only.** No creating leads from inside the admin. New items only enter via marketing form submissions.
7. **Enrichment data structure ready for P11.** Build the column, don't build the AI agent yet.
8. **Mobile/iPad readable.** Roni reviews inbox from her phone often.
9. **Lighthouse 85+** on admin pages.

---

# DATA MODEL

## Migration: `0010_inbox_status.sql`

```sql
-- Add status workflow columns to all three inbound tables

-- Lead captures (homepage email signup)
alter table public.lead_captures
  add column if not exists status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'closed')),
  add column if not exists status_changed_at timestamptz default now(),
  add column if not exists status_changed_by uuid references auth.users(id),
  add column if not exists admin_notes text,
  add column if not exists enrichment_data jsonb,
  add column if not exists enriched_at timestamptz;

create index if not exists idx_lead_captures_status on public.lead_captures(status);
create index if not exists idx_lead_captures_created_at on public.lead_captures(created_at desc);

-- Demo requests (/demo form)
alter table public.demo_requests
  add column if not exists status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'closed')),
  add column if not exists status_changed_at timestamptz default now(),
  add column if not exists status_changed_by uuid references auth.users(id),
  add column if not exists admin_notes text,
  add column if not exists enrichment_data jsonb,
  add column if not exists enriched_at timestamptz;

create index if not exists idx_demo_requests_status on public.demo_requests(status);
create index if not exists idx_demo_requests_created_at on public.demo_requests(created_at desc);

-- Contact messages (/contact form)
alter table public.contact_messages
  add column if not exists status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'closed')),
  add column if not exists status_changed_at timestamptz default now(),
  add column if not exists status_changed_by uuid references auth.users(id),
  add column if not exists admin_notes text;
  -- contact_messages does NOT get enrichment_data — those are typically existing customers, not leads
  
create index if not exists idx_contact_messages_status on public.contact_messages(status);
create index if not exists idx_contact_messages_created_at on public.contact_messages(created_at desc);

-- Confirm RLS is enabled on all three (should be from earlier sessions)
alter table public.lead_captures enable row level security;
alter table public.demo_requests enable row level security;
alter table public.contact_messages enable row level security;

-- Admin-only policies (Class C — practices never see these)
-- These tables get inbound writes from the marketing site (anonymous users)
-- so we need separate insert policies + admin read/update policies

-- Lead captures
drop policy if exists lead_captures_admin_all on public.lead_captures;
create policy lead_captures_admin_all on public.lead_captures
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists lead_captures_anon_insert on public.lead_captures;
create policy lead_captures_anon_insert on public.lead_captures
  for insert with check (true); -- API route validates server-side

-- Demo requests
drop policy if exists demo_requests_admin_all on public.demo_requests;
create policy demo_requests_admin_all on public.demo_requests
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists demo_requests_anon_insert on public.demo_requests;
create policy demo_requests_anon_insert on public.demo_requests
  for insert with check (true);

-- Contact messages
drop policy if exists contact_messages_admin_all on public.contact_messages;
create policy contact_messages_admin_all on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists contact_messages_anon_insert on public.contact_messages;
create policy contact_messages_anon_insert on public.contact_messages
  for insert with check (true);
```

Note: this migration adds columns and refines RLS policies. It should be idempotent (safe to re-run via `if not exists` and `drop policy if exists`).

---

# UI — `/admin/inbox`

## Page header

```
Eyebrow: § ADMIN
H1: Inbox.
Lead: All inbound from the marketing site. Manage leads, demo requests, and contact messages in one place.
```

## Filter bar (sticky)

Below the page header. Two rows on mobile, one row on desktop.

**Type filter pills (left side):**
```
[All] [Leads] [Demo Requests] [Contact Messages]
```

Pill states:
- Active pill: midnight-deep background, cream-100 text
- Inactive pill: bone-100 background, ink-700 text, ink-100 border
- Hover: ink-200 border on inactive
- Each pill shows count next to label: "Leads · 12"

**Status filter dropdown (right of pills):**
- "All statuses" / "New" / "Contacted" / "Qualified" / "Closed"
- Defaults to "New" on first load (so unhandled items surface first)
- Clicking a type pill resets to "All statuses" if currently filtered to "New" but the type has zero "New" items

**Search input (right side):**
- Placeholder: "Search by name or email"
- Searches across name + email + subject (for contact) / practice name (for demo) / form-source (for lead)
- Debounce 300ms

**Sort:**
- Default: newest first
- Optional dropdown: "Newest" / "Oldest" / "Recently updated"

## Inbox list

Desktop: table layout. Mobile: stacked cards.

**Desktop columns:**

| Type | Name / Email | Subject / Context | Status | Received | Updated |
|------|-------------|-------------------|--------|----------|---------|
| Demo | Sarah Chen / sarah@... | Sterling Aesthetic Group · CA | New | 2h ago | — |
| Lead | (anon) / aida@... | Homepage capture · UTM:google | New | 4h ago | — |
| Contact | Dr. Marks / marks@... | Question about pricing | Contacted | 1d ago | 4h ago |
| Demo | Tom Reilly / tom@... | Reilly Skin · NY | Qualified | 3d ago | 1d ago |

**Visual treatment:**
- Type column: small chip with type label + icon (Lucide: Mail for lead, Calendar for demo, MessageCircle for contact)
- Name/email: name in Inter regular ink-900, email in Inter 13px ink-500 below
- Subject/context: Inter regular ink-700, single line, truncated with ellipsis
- Status: colored chip per state (see below)
- Received: relative time ("2h ago", "1d ago"), absolute on hover
- Hairline 1px ink-100 between rows
- Click row → detail view at `/admin/inbox/[type]/[id]`

**Status chip colors:**
- new: error-700 (urgent attention)
- contacted: brand-700 (in progress)
- qualified: ink-900 with brand-300 dot prefix (strong, advancing)
- closed: ink-300 (deprioritized)

**Mobile cards:**

```
[Type chip] [Status chip]              2h ago
Sarah Chen
sarah@sterlingaesthetic.com
Sterling Aesthetic Group · CA
```

Tap card → detail view.

## Empty states

- No items at all: "No inbound yet. Submissions from the marketing site appear here as they arrive."
- No items match filters: "No items match these filters. Try clearing one or more filters." with Clear filters action

## Pagination

Same pattern as P7: numbered buttons on desktop, prev/next + "X of Y" on mobile. 50 per page.

---

# UI — Detail Views

Three different layouts because the data shapes differ. All share the same chrome (header, status workflow, admin notes, audit log).

## `/admin/inbox/lead/[id]` — Lead detail

Lead captures are minimal (email + UTM source) but with potential for AI enrichment.

**Layout:**

Top section:
- Breadcrumb: `Inbox › Lead capture · {received date}`
- Eyebrow: `§ LEAD CAPTURE`
- H1: email address (Fraunces, large)
- Status chip + received timestamp
- Action row: status workflow buttons + close button

Body sections:

**Section A — Contact**
- Email
- Captured at (full timestamp)

**Section B — Source context**
- UTM source / medium / campaign
- Page captured from (homepage, etc.)
- Referrer URL
- IP-derived location (country/region only — no IP storage post-launch)

**Section C — Enrichment** (P11 reserved)
- If `enrichment_data` is null: subtle placeholder "AI enrichment will run here in a future release."
- If populated: structured display of enriched data (practice info, role guesses, web presence)
- "Re-run enrichment" button reserved for P11 (disabled in P8 with tooltip "Available after P11 launch")

**Section D — Status workflow**
- Current status with prefix
- Workflow controls (see "Status workflow control" component below)

**Section E — Admin notes**
- Inline-editable textarea, saves on blur
- Internal-only context (e.g., "Met at AAD; high intent")

**Section F — Audit log**
- Status changes only (lead captures don't have other writeable fields)
- Newest first, max 50 entries

## `/admin/inbox/demo/[id]` — Demo request detail

Demo requests have rich context: practice name, role, current devices, indications of interest, timeline.

**Layout:**

Top section:
- Breadcrumb: `Inbox › Demo request · {practice name}`
- Eyebrow: `§ DEMO REQUEST`
- H1: requester full name (Fraunces, large)
- Sub-heading: practice name + role + state
- Status chip + received timestamp + UTM context
- Action row: status workflow buttons + "Send follow-up email" link (mailto: with templated subject)

Body sections:

**Section A — Requester**
- Name (first + last)
- Email
- Phone
- Role at practice

**Section B — Practice**
- Practice name
- Practice type
- State
- Monthly treatment volume
- Current devices in use

**Section C — Demo intent**
- Primary interest areas (multi-select from form)
- Timeline expectation
- Notes / additional context (free text from form)

**Section D — Source**
- UTM source/medium/campaign
- Submission timestamp

**Section E — Enrichment** (P11 reserved)
- Same pattern as lead detail
- AI-enriched practice info, web presence, peer practitioners
- Most valuable enrichment surface — demo requests are the primary qualification target

**Section F — Status workflow**

**Section G — Admin notes**

**Section H — Audit log**
- Status changes + admin note edits

## `/admin/inbox/contact/[id]` — Contact message detail

Contact messages are general inquiries with subject + body.

**Layout:**

Top section:
- Breadcrumb: `Inbox › Contact message · {subject}`
- Eyebrow: `§ CONTACT MESSAGE`
- H1: message subject (Fraunces, large)
- Sub-heading: sender name + email
- Status chip + received timestamp
- Action row: status workflow buttons + "Reply via email" link (mailto: pre-filled with original subject)

Body sections:

**Section A — Sender**
- Name
- Email
- Organization (if provided)

**Section B — Message**
- Subject
- Body (full text, preserve formatting and line breaks)
- Sent timestamp

**Section C — Source**
- UTM source/medium/campaign
- Submission timestamp

**Section D — Status workflow**

**Section E — Admin notes**

**Section F — Audit log**

## Status workflow control (shared component)

Lives at the top of every detail view, beneath the H1 and metadata.

**Visual:**

```
Current: [STATUS CHIP] · Updated 4h ago by you

[← Move back to {previous}]  [Advance to {next} →]  [Or change to ▼]
```

Behavior:
- "Move back" only renders if there's a previous state (not visible on `new`)
- "Advance" only renders if there's a next state (not visible on `closed`)
- "Or change to" dropdown lets admin jump directly to any state
- Each state change:
  1. Updates the row's `status` + `status_changed_at` + `status_changed_by`
  2. Audit log entry: `{type}.status_changed` with from/to in metadata
  3. Sonner toast confirmation: "Marked as {newStatus}."
  4. Optimistic UI update (instant feedback) with server-side persistence

State progression:
```
new → contacted → qualified → closed
```

Direct jumps allowed (e.g., new → closed if it's spam, or contacted → closed if not a fit).

---

# COMPONENTS

```
components/admin/inbox/
├── InboxFilterBar.tsx              (client — type pills + status filter + search)
├── InboxTypePills.tsx              (client — pill row with counts)
├── InboxList.tsx                   (server — table on desktop, cards on mobile)
├── InboxRow.tsx                    (server — single row, accepts any type)
├── InboxCard.tsx                   (server — mobile card variant)
├── InboxStatusChip.tsx             (server — colored status indicator)
├── InboxTypeChip.tsx               (server — type indicator with icon)
├── EmptyInboxState.tsx             (server — no items / no matches)
├── StatusWorkflowControl.tsx       (client — back/advance/jump buttons)
├── LeadDetailView.tsx              (server — full lead detail)
├── DemoRequestDetailView.tsx       (server — full demo detail)
├── ContactMessageDetailView.tsx    (server — full contact detail)
├── EnrichmentSection.tsx           (server — placeholder + future renderer)
└── AdminNotesField.tsx             (client — inline editable, saves on blur)
```

---

# DATA LAYER

## `lib/admin/inbox.ts`

Server-only.

```typescript
import "server-only";
import { getServiceClient } from "@/lib/supabase/server-auth";
import { logAudit } from "@/lib/admin/audit";

export type InboxItemType = 'lead' | 'demo' | 'contact';
export type InboxStatus = 'new' | 'contacted' | 'qualified' | 'closed';

export interface InboxItem {
  type: InboxItemType;
  id: string;
  receivedAt: string;
  status: InboxStatus;
  statusChangedAt: string;
  
  // Display fields (varies by type)
  displayName: string;        // e.g. "Sarah Chen" or "(anonymous)"
  displayEmail: string;
  displayContext: string;     // e.g. "Sterling Aesthetic Group · CA"
}

export async function listInboxItems(filters: {
  type?: InboxItemType | 'all';
  status?: InboxStatus | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: InboxItem[]; total: number; counts: { all: number; lead: number; demo: number; contact: number } }>;

export async function getLeadCaptureById(id: string);
export async function getDemoRequestById(id: string);
export async function getContactMessageById(id: string);

export async function updateInboxItemStatus(
  type: InboxItemType,
  id: string,
  newStatus: InboxStatus,
  actorId: string
): Promise<void>;

export async function updateInboxItemNotes(
  type: InboxItemType,
  id: string,
  notes: string,
  actorId: string
): Promise<void>;

export async function getInboxNewCount(): Promise<number>;
// Used by AdminSidebar to show badge count across all three types
```

The list query is the trickiest piece — three tables with different shapes need to be UNION'd into one result set. Use a Supabase RPC for performance:

```sql
-- Migration: 0010_inbox_status.sql (continued)
create or replace function public.list_inbox_items(
  filter_type text default 'all',  -- 'all' | 'lead' | 'demo' | 'contact'
  filter_status text default 'all', -- 'all' | 'new' | 'contacted' | 'qualified' | 'closed'
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
      coalesce(l.first_name, 'Anonymous lead') as display_name,
      l.email as display_email,
      coalesce(l.utm_source, 'Direct') as display_context
    from public.lead_captures l
    where (filter_type = 'all' or filter_type = 'lead')
      and (filter_status = 'all' or l.status = filter_status)
      and (search_query is null 
        or l.email ilike '%' || search_query || '%'
        or coalesce(l.first_name, '') ilike '%' || search_query || '%')
    
    union all
    
    -- Demo requests
    select
      'demo'::text as type,
      d.id,
      d.created_at as received_at,
      d.status,
      d.status_changed_at,
      d.first_name || ' ' || d.last_name as display_name,
      d.email as display_email,
      d.practice_name || ' · ' || coalesce(d.state, '') as display_context
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
    select 'lead'::text, count(*) from public.lead_captures
      where filter_status = 'all' or status = filter_status
    union all
    select 'demo'::text, count(*) from public.demo_requests
      where filter_status = 'all' or status = filter_status
    union all
    select 'contact'::text, count(*) from public.contact_messages
      where filter_status = 'all' or status = filter_status;
end;
$$;

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
    select 
      (select count(*) from public.lead_captures where status = 'new')
      + (select count(*) from public.demo_requests where status = 'new')
      + (select count(*) from public.contact_messages where status = 'new')
  );
end;
$$;
```

---

# API ROUTES

## `app/api/admin/inbox/route.ts`

**GET** — List with filters
- `requireAdmin()`
- Parse query params: type, status, search, page
- Call `listInboxItems()`
- Return { items, total, counts }

## `app/api/admin/inbox/[type]/[id]/route.ts`

**GET** — Single item detail
- `requireAdmin()`
- Validate type ∈ {lead, demo, contact}
- Fetch from appropriate table
- Return full record

**PATCH** — Update status or admin notes
- `requireAdmin()`
- Validate body (status enum + notes string)
- Update appropriate table
- Audit log entry: `{type}.status_changed` or `{type}.notes_updated`
- Return updated record

---

# ADMIN SIDEBAR UPDATE

`AdminSidebar.tsx` NAV_ITEMS update. Order:

```
1. Dashboard       → /admin/dashboard
2. Practices       → /admin/practices
3. Inbox           → /admin/inbox          (NEW, with badge count for 'new' items)
4. Adverse Events  → /admin/adverse-events (existing badge count)
5. Protocols       → /admin/protocols
```

Inbox badge count:
- Server-rendered in AdminLayout
- Calls `getInboxNewCount()` once per layout render
- Caches for 60s (same pattern as adverse events)
- Renders as small chip with count next to "Inbox" label
- Hidden if count is 0

---

# VERIFICATION

Before declaring done:

1. `npm run build` clean
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Migration written, NOT applied to prod
5. Manual test sequence (after migration applied):
   - Sign in as admin
   - Visit `/admin/inbox` → unified list renders
   - Default filter is "All types · New status" (or all statuses, depending on count)
   - Click "Demo Requests" pill → list filters to demo requests only, count badge updates
   - Click "All" pill → list returns to combined view
   - Use status filter dropdown → results filter
   - Search "sarah" → results filter to matching items across all three types
   - Click an inbox row → detail page renders with correct shape per type
   - Update status from new → contacted → audit log entry written, status chip updates
   - Add admin note → save on blur, audit log entry, value persists on refresh
   - Use "Reply via email" link on contact message → opens mail client with pre-filled subject
   - Sidebar badge count updates after status changes (within 60s cache window)
6. RLS verification:
   - Sign in as practice user
   - Try direct URL `/admin/inbox` → blocked (403 or redirect to portal)
   - Try direct URL `/admin/inbox/lead/[id]` → blocked
7. Mobile/iPad test at 375px and 768px:
   - Type pills wrap or scroll horizontally without breaking layout
   - List renders as stacked cards
   - Detail view readable, status workflow control accessible
8. Anonymous form submissions still work (RLS insert policy preserved):
   - Submit lead capture from homepage → row inserts with status='new'
   - Submit demo request from /demo → row inserts with status='new'
   - Submit contact message from /contact → row inserts with status='new'

---

# PRE-DELIVERY CHECKLIST

- [ ] Tokens-only, no new colors/fonts/icons
- [ ] All migrations held for manual review
- [ ] All three RPCs check `is_admin()` first
- [ ] RLS preserves anonymous insert + admin all
- [ ] Status chip colors per spec
- [ ] Badge count caching at AdminSidebar (60s)
- [ ] Mobile pills + cards render correctly
- [ ] Search debounce 300ms
- [ ] All status changes audit-logged
- [ ] Admin notes save on blur, audit-logged
- [ ] Reduced motion respected
- [ ] All copy [DRAFT]-marked

---

# DELIVERABLES

When done, report:
1. Production preview URL `/admin/inbox`
2. Lighthouse scores
3. Migration SQL location (held)
4. Components built
5. Drafted copy flagged for approval
6. RLS verification confirmation
7. Anonymous insert verification (forms still work)
8. Decisions made not explicit in spec
9. Anything to verify before P9

After P8 is approved + migration applied + manual tests pass, P9 picks up: Training library + certification tracking.
