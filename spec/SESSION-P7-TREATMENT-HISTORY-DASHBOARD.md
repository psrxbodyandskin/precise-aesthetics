# Session P7 — Treatment History + Admin Dashboard

> Run after P6 (Treatment Logging) is deployed and confirmed working. Builds the practitioner-side filterable history view and the admin-side aggregated dashboard for Roni's clinical review.

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/PORTAL-MASTER-SPEC.md`
6. `spec/RLS-PATTERNS.md`
7. `spec/SESSION-P4-PROTOCOL-LIBRARY-SCHEMA.md`
8. `spec/SESSION-P5-PROTOCOL-LIBRARY-VIEWER.md`
9. `spec/SESSION-P6-TREATMENT-LOGGING.md`
10. This spec

---

## The Two Use Cases

**Practitioner side:** "Did I already log this treatment? Let me find a recent treatment to reference. Filter, scan, click through."

Read-only browsing of their own practice's logged treatments. No analytics for practitioners — they have their own systems for that. This view exists for reference and confirmation, not for pattern analysis.

**Admin side (Roni):** "What's the system telling us this week? Where are outcomes trending? Which protocols are working, which need refinement?"

Aggregated, anonymized view across all practices. Read-only in P7 (AI agents come in P11). Surfaces patterns through clean data presentation — practitioners' charts that Roni reads to inform protocol updates.

---

## Goal

After this session:
- `/portal/treatments` is a real filterable list (replacing the lightweight P6 version)
- Practitioners can filter their own treatments by date, protocol, indication, Fitzpatrick, has-photos, has-adverse-event
- `/admin/dashboard` is the new admin landing page with aggregated metrics
- Roni sees: total treatment volume, protocol performance breakdown, indication distribution, Fitzpatrick distribution, adverse event rate, recent treatments timeline
- All admin-side data is anonymized aggregates (no patient-level identifiers, no practice-level identifiers in the chart views — just patterns)
- Read-only — no editing of treatment records
- All access enforced by RLS

---

## What Gets Built

### Portal side
- `/portal/treatments` — replaces the P6 lightweight list with full filterable view
- Filter UI: search, date range, protocol, indication, Fitzpatrick, has-photos, has-adverse-event
- Filtered URL state (bookmarkable, shareable within practice)
- Pagination

### Admin side
- `/admin/dashboard` — new admin landing page (replaces current placeholder)
- AdminSidebar updated: "Dashboard" entry replaces the placeholder, default lands here
- Aggregated metrics queries (Supabase RPC functions for performance)
- Chart components (using recharts, already in the stack)

### Data layer
- `lib/portal/treatments.ts` — extend P6's data layer with filtered list query
- `lib/admin/dashboard.ts` — server-only dashboard data fetchers
- Supabase RPC functions for efficient aggregations (avoid N+1 queries)

### Components
- Portal treatment filter bar (similar to protocol filters from P5)
- Admin dashboard widgets (each metric is its own server component)

---

## Critical Constraints

1. **Build on P1-P6 foundation.** Use `requirePractice()` portal-side, `requireAdmin()` admin-side, RLS enforces scoping.
2. **MASTER.md tokens only.** No new colors, fonts, icons.
3. **Practitioners see their own data only.** RLS handles this automatically — never write app-layer filters that duplicate.
4. **Admin sees aggregated, anonymized data.** No patient identifiers (already de-identified at log time). No practice names in the dashboard surface (patterns matter, not which practice).
5. **Read-only in P7.** No edit forms, no status workflows. Just filtered viewing + aggregated charts.
6. **Server-side aggregation via Supabase RPCs.** Don't pull all treatments client-side and aggregate. Use SQL functions for performance.
7. **Reduced motion respected.** Charts render without entrance animations. No scroll-triggered effects.
8. **Mobile/iPad readable.** Filters collapse to a sheet on mobile. Charts adapt to viewport.
9. **Lighthouse 90+** on portal, **85+** on admin (data-heavy UIs trade some perf for capability).

---

# PORTAL SIDE — `/portal/treatments`

## Route

**File:** `app/(portal)/portal/treatments/page.tsx`

Replaces the lightweight P6 version.

## Layout

**Page header:**
- Eyebrow: `§ TREATMENTS`
- H1: `Treatments.`
- Lead: `All treatments logged by your practice. Filter by date, protocol, or indication.`

**Action button (top-right):**
- "+ Log treatment" → `/portal/treatments/new`

**Filter bar (sticky on scroll):**

Desktop: horizontal bar below page header. Mobile: trigger button "Filters" opens a `Sheet` from the right side.

Filter inputs:
- Search (free text, searches notes + treatment_site + entered_by_name)
- Date range picker (from / to dates)
- Protocol dropdown (multi-select, populated from this practice's logged protocols)
- Indication dropdown (multi-select, populated from this practice's logged indications)
- Fitzpatrick dropdown (multi-select: I-VI)
- "Has photos" toggle
- "Has adverse event" toggle
- Clear filters link (visible when any filter active)

**Results display:**

Table layout on desktop, card layout on mobile.

Desktop columns:
- Date
- Protocol (title + version chip)
- Indication
- Fitzpatrick
- Entered by
- Indicators: photo icon if photos attached, alert icon if adverse event flagged
- Actions: link to treatment detail

Mobile cards:
- Top row: date + indicators (photo, adverse event icons)
- Protocol title + version
- Indication · Fitzpatrick · Entered by
- Tap card → treatment detail

**Empty states:**
- No treatments logged at all: "No treatments logged yet. Log your first to begin contributing to the system." with CTA
- No treatments match filters: "No treatments match these filters. Try clearing one or more filters." with Clear filters action

**Pagination:**
- 50 per page
- Previous/Next buttons
- Current page indicator

## Data layer extension

**`lib/portal/treatments.ts`** — extend P6:

```typescript
export async function listTreatmentsForPractice(filters: {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  protocolIds?: string[];
  indications?: string[];
  fitzpatrickTypes?: string[];
  hasPhotos?: boolean;
  hasAdverseEvent?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const supabase = getAuthServerClient();
  
  let query = supabase
    .from("treatments")
    .select(`
      id,
      treatment_date,
      protocol:protocols(id, title, slug),
      protocol_version_label,
      indication,
      patient_fitzpatrick,
      entered_by_name,
      photo_count:treatment_photos(count),
      adverse_event:treatment_adverse_events(id)
    `, { count: 'exact' })
    .order("treatment_date", { ascending: false });
  
  if (filters.search) {
    query = query.or(`notes.ilike.%${filters.search}%,treatment_site.ilike.%${filters.search}%,entered_by_name.ilike.%${filters.search}%`);
  }
  if (filters.dateFrom) query = query.gte("treatment_date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("treatment_date", filters.dateTo);
  if (filters.protocolIds?.length) query = query.in("protocol_id", filters.protocolIds);
  if (filters.indications?.length) query = query.in("indication", filters.indications);
  if (filters.fitzpatrickTypes?.length) query = query.in("patient_fitzpatrick", filters.fitzpatrickTypes);
  // hasPhotos and hasAdverseEvent require post-filter on the joined counts
  
  const start = (filters.page ?? 0) * (filters.pageSize ?? 50);
  const end = start + (filters.pageSize ?? 50) - 1;
  query = query.range(start, end);
  
  const { data, error, count } = await query;
  if (error) throw error;
  
  // Post-filter for has-photos / has-adverse-event flags
  let filtered = data;
  if (filters.hasPhotos !== undefined) {
    filtered = filtered.filter(t => 
      filters.hasPhotos ? t.photo_count > 0 : t.photo_count === 0
    );
  }
  if (filters.hasAdverseEvent !== undefined) {
    filtered = filtered.filter(t => 
      filters.hasAdverseEvent ? t.adverse_event !== null : t.adverse_event === null
    );
  }
  
  return { treatments: filtered, total: count };
}
```

Helpers:
- `getDistinctProtocolsForPractice()` — returns protocols this practice has actually logged treatments against (for filter dropdown population)
- `getDistinctIndicationsForPractice()` — same for indications

## Components

```
components/portal/treatments/
├── TreatmentsFilterBar.tsx        (client — sticky horizontal bar desktop, sheet on mobile)
├── TreatmentsTable.tsx            (server — desktop table)
├── TreatmentsCardList.tsx         (server — mobile cards)
├── TreatmentRow.tsx               (server — single row in table)
├── TreatmentCard.tsx              (server — single card in mobile list)
├── TreatmentIndicators.tsx        (server — photo + adverse event icons)
└── EmptyTreatmentsState.tsx       (server — handles all three empty states)
```

Reuse `Sheet` (already in stack from shadcn) for mobile filter drawer.

## Filter URL state

Filters live in URL search params (per P5 pattern):
```
/portal/treatments?dateFrom=2026-01-01&fitzpatrick=V,VI&hasAdverse=true
```

Use `lib/portal/filters.ts` from P5 as the pattern. Extend the parser/serializer for the new filter shape.

---

# ADMIN SIDE — `/admin/dashboard`

## Route

**File:** `app/(admin)/admin/dashboard/page.tsx`

This becomes the new admin landing page. Update `/admin/page.tsx` to redirect here. Update `AdminSidebar` so "Dashboard" is the first nav entry.

## Layout

**Page header:**
- Eyebrow: `§ ADMIN`
- H1: `Dashboard.`
- Lead: `Aggregated treatment data across the network. Patterns surface here for clinical review.`

**Time range selector (top-right):**
- Pill buttons: 7 days · 30 days · 90 days · 12 months · All time
- Default: 30 days
- All metrics below respect this filter

## Dashboard sections

### Section 1 — Top-line metrics (KPI row)

Four-card row across the top showing core counts:

**Card 1 — Total treatments**
- Big number: count of treatments in the time range
- Sub-line: comparison to previous period ("+18% vs prior 30 days")
- Trend arrow (up/down)

**Card 2 — Active practices**
- Big number: practices that logged ≥1 treatment in time range
- Sub-line: total practices on the system
- Calculation: `count(distinct practice_id) where treatment_date >= range_start`

**Card 3 — Adverse event rate**
- Big number: percentage (events / treatments)
- Sub-line: raw event count
- Color: ink-900 if ≤2%, brand-700 if >2% and ≤5%, error-700 if >5% (visual flag, not alarm)

**Card 4 — Photos uploaded**
- Big number: count of treatment_photos in range
- Sub-line: % of treatments with photos
- Pattern: indicates engagement depth

### Section 2 — Treatment volume over time

Line chart, full-width.
- X-axis: dates (binned by day for ≤30d, by week for 90d/12m, by month for all-time)
- Y-axis: treatment count
- Single line, brand-700
- Hover tooltip: exact count for that period
- Reduced motion: no entrance animation, plot renders static

### Section 3 — Protocol performance

Two-column layout:

**Left column — Most-used protocols (table):**
- Protocol title + version
- Treatment count
- Adverse event rate (events / treatments for this protocol)
- Avg patient Fitzpatrick (mode of distribution)
- Last used date

Sorted by treatment count, top 10. Click row → could link to protocol detail (future enhancement; P7 is read-only).

**Right column — Protocol coverage:**
- Stacked bar chart
- One bar per protocol (top 10)
- Bar segments: Fitzpatrick I, II, III, IV, V, VI in distinct shades
- Shows which protocols are being used across which skin types
- Surfaces gaps (e.g., protocol authored for Fitz I-VI but only used on I-III in practice)

### Section 4 — Indication distribution

Donut chart. 
- Each segment = an indication
- Sized by treatment count
- Top 8 indications + "Other" segment for the rest
- Hover: count + percentage
- Color palette: brand spectrum (brand-300, brand-500, brand-700, ink variants for "other")

Surfaces: which clinical needs the network is addressing most.

### Section 5 — Fitzpatrick distribution

Horizontal stacked bar (or six-row bar chart).
- Six bars: I, II, III, IV, V, VI
- Width: treatment count for that Fitzpatrick type
- Annotation per bar: count + percentage
- Reinforces the brand thesis (consistent outcomes across spectrum)

### Section 6 — Adverse events panel

Card-style summary at the bottom (smaller than charts, denser):
- Total adverse events in time range
- Breakdown by status (new / reviewing / addressed)
- Most recent 5 events (date · practice ID hashed · indication · status chip)
- "View all adverse events →" link to /admin/adverse-events

Practice ID hashed: show a short anonymized identifier (first 4 chars of practice UUID) so Roni can identify across multiple events without seeing practice names directly. Click event → adverse event detail page (already shows full practice context for Roni's review).

### Section 7 — Recent treatments timeline

Sliding list, last 20 treatments across all practices (anonymized):
- Date · Protocol · Indication · Fitzpatrick · Has photos · Adverse event flag
- No practice names in the list view
- Click → admin treatment detail (built in P7 below)

## Data layer

**`lib/admin/dashboard.ts`** — server-only:

```typescript
import "server-only";
import { getServiceClient } from "@/lib/supabase/server-auth";

export async function getDashboardMetrics(range: TimeRange) {
  const supabase = getServiceClient();
  const { rangeStart, rangeEnd, comparisonStart } = computeRange(range);
  
  // Use Supabase RPC functions for aggregations (defined in migration)
  const [topLine, volumeOverTime, protocolStats, indicationDist, fitzDist, adverseEvents, recentTreatments] = 
    await Promise.all([
      supabase.rpc('dashboard_top_line', { range_start: rangeStart, range_end: rangeEnd, comparison_start: comparisonStart }),
      supabase.rpc('dashboard_volume_timeseries', { range_start: rangeStart, range_end: rangeEnd, range: range }),
      supabase.rpc('dashboard_protocol_stats', { range_start: rangeStart, range_end: rangeEnd }),
      supabase.rpc('dashboard_indication_distribution', { range_start: rangeStart, range_end: rangeEnd }),
      supabase.rpc('dashboard_fitzpatrick_distribution', { range_start: rangeStart, range_end: rangeEnd }),
      supabase.rpc('dashboard_adverse_events_summary', { range_start: rangeStart, range_end: rangeEnd }),
      supabase.rpc('dashboard_recent_treatments', { limit_count: 20 }),
    ]);
  
  // Handle errors, return shaped data
}
```

## Supabase RPC functions

Migration: `0009_dashboard_rpcs.sql` (held for manual review)

Each RPC is a SQL function that runs server-side, returns aggregated data. Examples:

```sql
-- dashboard_top_line: returns total counts for current period + previous period
create or replace function public.dashboard_top_line(
  range_start timestamptz,
  range_end timestamptz,
  comparison_start timestamptz
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  -- Only callable by admins
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;
  
  select json_build_object(
    'total_treatments', (select count(*) from treatments where treatment_date between range_start::date and range_end::date),
    'total_treatments_prior', (select count(*) from treatments where treatment_date between comparison_start::date and range_start::date),
    'active_practices', (select count(distinct practice_id) from treatments where treatment_date between range_start::date and range_end::date),
    'total_practices', (select count(*) from practices where status = 'active'),
    'adverse_events', (select count(*) from treatment_adverse_events where created_at between range_start and range_end),
    'photos_uploaded', (select count(*) from treatment_photos where created_at between range_start and range_end)
  ) into result;
  
  return result;
end;
$$;

-- Similar functions for volume_timeseries, protocol_stats, indication_distribution, 
-- fitzpatrick_distribution, adverse_events_summary, recent_treatments
```

All RPCs:
- `security definer` (run with elevated privileges)
- Check `is_admin()` first, raise exception if not admin
- Return JSON for clean client-side consumption
- Performance-tested at 10k+ treatments

## Admin treatment detail page

`/admin/treatments/[id]` — admin can view any treatment record (RLS allows admin all access).

Layout: same as `/portal/treatments/[id]` but with:
- Practice name and contact (visible to admin)
- Full audit trail
- Link to associated adverse event if flagged
- No edit capability (read-only in P7)

## Components

```
components/admin/dashboard/
├── DashboardHeader.tsx           (server — title + time range selector)
├── TimeRangeSelector.tsx         (client — pill buttons)
├── KpiCardRow.tsx                (server — top-line metrics)
├── KpiCard.tsx                   (server — single metric card)
├── VolumeTimeSeriesChart.tsx     (client — recharts LineChart, prefers reduced motion)
├── ProtocolStatsTable.tsx        (server — most-used protocols table)
├── ProtocolCoverageChart.tsx     (client — stacked bar)
├── IndicationDistributionChart.tsx (client — recharts PieChart/Donut)
├── FitzpatrickDistributionChart.tsx (client — horizontal bars)
├── AdverseEventsPanel.tsx        (server — summary card with link)
├── RecentTreatmentsList.tsx      (server — anonymized timeline)
└── PracticeIdHash.tsx            (server — renders short hash of practice UUID)
```

Charts use `recharts` (already in dependencies). Brand color palette only.

---

# ADMIN SIDEBAR UPDATE

`AdminSidebar.tsx` NAV_ITEMS update. Order:

```
1. Dashboard       → /admin/dashboard       (new — replaces /admin landing)
2. Practices       → /admin/practices
3. Adverse Events  → /admin/adverse-events  (with new-count badge from P6)
4. Protocols       → /admin/protocols
```

`/admin` route redirects to `/admin/dashboard`.

---

# VERIFICATION

Before declaring done:

1. `npm run build` clean
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Migration `0009_dashboard_rpcs.sql` written, NOT applied to prod
5. Manual test sequence (after migration applied):
   - Sign in as practice user with treatments logged
   - Visit `/portal/treatments` → see filtered list
   - Apply filters one at a time → results refine correctly
   - URL updates with each filter change
   - Refresh page → filters persist from URL
   - Click "Clear filters" → resets
   - Mobile (375px): filter sheet opens, all filters usable
   - Empty state when filters exclude all → renders correctly
6. Sign in as admin:
   - Visit `/admin` → redirects to `/admin/dashboard`
   - All KPI cards render with correct numbers
   - All charts render without animation (or with reduced motion respect)
   - Time range selector changes data — every section refreshes
   - Recent treatments list shows anonymized rows (no practice names)
   - Click a recent treatment → admin treatment detail renders
   - Click "View all adverse events" → routes to /admin/adverse-events
7. RLS verification:
   - Sign in as practice → try direct URL `/admin/dashboard` → blocked
   - Sign in as practice → try direct URL `/admin/treatments/[id]` → blocked
   - Practice can only see their own treatments via portal RLS
8. Performance:
   - Lighthouse on `/portal/treatments` (filtered) — 90+
   - Lighthouse on `/admin/dashboard` — 85+
   - Page load < 1s on cable connection
   - No N+1 queries (verify via Supabase logs)
9. Reduced motion test:
   - Set `prefers-reduced-motion: reduce` in browser
   - Charts render without entrance animations
   - No transition effects on filter updates

---

# PRE-DELIVERY CHECKLIST

- [ ] Tokens-only, no new colors/fonts/icons
- [ ] All migrations held for manual review
- [ ] RLS handles practice scoping (no app-layer filters duplicating)
- [ ] Admin RPCs check `is_admin()` first
- [ ] All charts use brand color palette only
- [ ] Anonymization on admin side (no practice names in dashboard charts)
- [ ] Reduced motion respected on all charts
- [ ] Mobile filter sheet works on iPad and small mobile
- [ ] URL state persistence for filters
- [ ] Empty states for all list/chart views
- [ ] Read-only — no edit forms in P7
- [ ] All copy [DRAFT]-marked

---

# DELIVERABLES

When done, report:
1. Production preview URLs (`/portal/treatments`, `/admin/dashboard`)
2. Lighthouse scores (portal + admin)
3. Migration SQL location (held)
4. Components built
5. Drafted copy flagged for approval
6. RLS verification confirmation (cross-practice + admin gating)
7. Performance test results (page load, query times via Supabase logs)
8. Mobile/iPad responsive test results
9. Decisions made not explicit in spec
10. Anything to verify before P8

After P7 is approved + migration applied + manual tests pass, P8 picks up: Lead/demo/contact inbox (admin).
