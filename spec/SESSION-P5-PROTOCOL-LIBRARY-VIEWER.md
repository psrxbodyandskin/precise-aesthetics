# Session P5 — Protocol Library Viewer (Portal Side)

> Run after P4 (Protocol Library Schema + Admin CRUD) is deployed, migration applied, Sanity webhook configured, and a test protocol successfully synced. Builds the practitioner-facing protocol library — the centerpiece feature of the portal.

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/PORTAL-MASTER-SPEC.md`
6. `spec/RLS-PATTERNS.md`
7. `spec/SESSION-P4-PROTOCOL-LIBRARY-SCHEMA.md` (data model reference)
8. This spec

---

## The Use Case

This is not a browsing website. This is a **chair-side clinical reference document.**

A practitioner is preparing to treat a patient — or actively in the middle of treatment — and needs to look up parameters, recovery requirements, contraindications. They are using an iPad at the chair, or they printed the protocol that morning. They are not "exploring." They are executing.

Every design decision flows from this:

- **Information density tuned for clinical reference.** Dense but readable. Not whitespace-luxurious like the marketing site.
- **Reading order, not navigation order.** Single scrollable document with strong typographic hierarchy. Practitioners scan visually to the section they need; they don't click through tabs.
- **Print-friendly is non-negotiable.** Every protocol must print as a single-page-or-multi-page clinical reference document. No navigation chrome, no decorative imagery, no "click to expand" content.
- **Mobile/iPad-readable.** Touch targets, readable type at arm's length, parameter tables that don't horizontal-scroll into oblivion.
- **Read-only consumer.** No editing in the portal. All authoring lives in Sanity Studio (admin path).

---

## Goal

After this session:
- Practitioners can browse the protocol library at `/portal/protocols`
- Filtering by indication, Fitzpatrick type, search by title
- Click a protocol → `/portal/protocols/[slug]` full reading view
- Print view (`@media print` styles) renders clean clinical reference document
- All access enforced by Class B RLS from P4 — only published protocols for owned devices
- Empty state when no protocols match filters or practice has no devices that map to any protocol

---

## What Gets Built

### Routes
- `/portal/protocols` — library list view
- `/portal/protocols/[slug]` — full protocol reading view (chair-side reference)
- Print stylesheet for the detail view

### Components
- `ProtocolLibraryFilters` — search + indication filter + Fitzpatrick type filter
- `ProtocolCard` — list item summarizing one protocol
- `ProtocolReadingView` — the full clinical reference document
- `ProtocolReadingHeader` — title, version, indication, Fitzpatrick chips
- `ParameterEnvelopeTable` — clinical parameter table (printable, mobile-readable)
- `BiologicControlSummary` — prep/recovery/maintenance requirements block
- `ProtocolReferences` — citation list
- `PrintButton` — triggers `window.print()`

### Data layer
- `lib/portal/protocols.ts` — server-only data fetchers reading from Supabase mirror
- Sanity content fetched on-demand for full reading view (uses Sanity ID stored in Supabase row)

### Nav
- Update portal layout to include "Protocols" as primary nav item
- "Protocols" set as the default `/portal` landing experience (or close to it)

---

## Critical Constraints

1. **Build on P1+P2+P3+P4 foundation.** Use `requirePractice()` from `lib/auth/server.ts`. RLS does the device-gating and status filtering automatically — do not add app-layer filters that duplicate RLS logic.
2. **MASTER.md tokens only.** No new colors, fonts, icons.
3. **Single scrollable document for the detail view.** No tabs. No accordions. No "click to expand." If content is in a protocol, it's visible.
4. **Print stylesheet mandatory.** Every protocol detail view must print cleanly without navigation, sidebars, or decorative chrome.
5. **iPad-first mobile design.** Test at iPad widths (768-1024px) explicitly. Parameter tables remain readable without horizontal scroll.
6. **Server Components by default.** Filters and search are client-side, but the rendering of protocol content stays server-rendered for performance.
7. **No images on practitioner side.** No decorative images, no Fig. annotations, no marketing visual treatments. This is a clinical document, not editorial. Save the editorial register for marketing site.
8. **Reading order matters.** The detail view follows the clinical sequence: identity → indication → parameters → execution guidance → biologic control → contraindications → references.
9. **Lighthouse 95+** on portal protocol pages. They load fast even over hospital wifi.
10. **Reduced motion respected.** No animations on transitions, no scroll effects.

---

# PAGE 1 — `/portal/protocols` (Library List)

**Route:** `app/(portal)/portal/protocols/page.tsx`

**Purpose:** Find a protocol fast. Filter, search, scan results, click into the document.

## Layout

**Page header:**
- Eyebrow: `§ PROTOCOL LIBRARY`
- H1: `Protocols`
- Lead: `The current protocol library for your practice. Filter by indication or skin type to find what you need.`

**Filter bar (sticky on scroll):**

A horizontal bar below the page header, sticky to the top when scrolling. Contains:

- Search input (placeholder: "Search protocols")
- Indication dropdown (multi-select, populated from indication_categories table)
- Fitzpatrick type dropdown (multi-select: I, II, III, IV, V, VI)
- "Clear filters" link (only visible when filters are active)

**Results grid:**

List of `ProtocolCard` components. Vertical stack on mobile, two-column on desktop (>1024px), three-column on wide screens (>1440px).

**Empty states:**

- No protocols at all (practice has no devices that map to any published protocols):
  - Heading: "No protocols available yet."
  - Body: "Protocols are tied to your owned devices. New protocols appear here as they're published."
- No protocols match filters:
  - Heading: "No protocols match these filters."
  - Body: "Try clearing one or more filters."
  - Action: "Clear filters" button

## ProtocolCard Component

Each card represents one protocol. Compact but information-dense.

**Layout:**

```
[ Status indicator dot (small, brand-300 if updated recently) ]   [Version chip: v1.1]

PROTOCOL TITLE (Fraunces, 22px, ink-900)
Indication category · Comma-separated indications

Fitzpatrick chips: I  II  III  IV  V  VI (highlighted = applicable)

Short description (Inter 14px, 2-line clamp, ink-700)

────────────────────────────────────────
Updated: 2026-04-15 · Version 1.1
```

**Visual treatment:**
- Card surface: bone-50, 1px ink-100 border, 8px rounded corners
- Hover: ink-200 border, subtle elevation
- Click target: entire card is a link to `/portal/protocols/[slug]`
- Padding: p-6 desktop, p-4 mobile
- Spacing between cards: gap-4

**Accessibility:**
- Full card is a link (`<Link>` wrapping content)
- Focus visible
- Title is the accessible name

## Data fetching

```typescript
// Server component
import { listProtocolsForPractice } from "@/lib/portal/protocols";
import { requirePractice } from "@/lib/auth/server";

export default async function ProtocolsPage({ searchParams }) {
  await requirePractice();
  const filters = parseFilters(searchParams);
  const protocols = await listProtocolsForPractice(filters);
  // RLS already filters to: status='published' + device-gated for current_practice_id()
  return <ProtocolLibraryView protocols={protocols} filters={filters} />;
}
```

**`lib/portal/protocols.ts`:**

```typescript
import "server-only";
import { getAuthServerClient } from "@/lib/supabase/server-auth";

export async function listProtocolsForPractice(filters: {
  search?: string;
  indicationCategoryIds?: string[];
  fitzpatrickTypes?: string[];
}) {
  const supabase = getAuthServerClient();
  
  let query = supabase
    .from("protocols")
    .select(`
      id,
      sanity_id,
      title,
      slug,
      short_description,
      indications,
      fitzpatrick_types,
      current_version,
      last_published_at,
      indication_category:indication_categories(id, title, slug)
    `)
    .order("title", { ascending: true });
  
  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }
  if (filters.indicationCategoryIds?.length) {
    query = query.in("indication_category_id", filters.indicationCategoryIds);
  }
  if (filters.fitzpatrickTypes?.length) {
    query = query.overlaps("fitzpatrick_types", filters.fitzpatrickTypes);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
  // RLS handles status='published' + device-gated filter automatically
}

export async function getProtocolBySlug(slug: string) {
  // Returns the Supabase metadata + fetches Sanity content for full document
  // Used by the detail page
}
```

---

# PAGE 2 — `/portal/protocols/[slug]` (Reading View)

**Route:** `app/(portal)/portal/protocols/[slug]/page.tsx`

**Purpose:** The clinical reference document. Read top-to-bottom, scan by section, print if needed.

## Layout — Single Scrollable Document

The whole protocol reads as one continuous document. No tabs. No accordions. Maximum 720px content width (readable line length). Generous vertical spacing between sections. Strong typographic hierarchy.

### Section Order (Reading Order)

1. **Header block** — title, version, last published, print button
2. **Identity** — indication category, indications, Fitzpatrick types
3. **Clinical overview** — Sanity rich-text rendering
4. **Parameter envelope** — table of wavelength × fluence × pulse × spot configurations
5. **Session guidance** — expected sessions, spacing, notes
6. **Biologic control** — prep/recovery/maintenance requirements + notes
7. **Contraindications** — bulleted list
8. **References** — citation list with optional URLs

### Header Block

```
[ ← Back to library ]                              [ Print ↓ ]

Eyebrow (Inter overline, ink-500): § Pigmentary disorders · v1.1

H1 (Fraunces, 36-44px desktop, 28-32px mobile, ink-900):
Protocol title goes here.

Subtitle (Inter 18px, ink-700, max-w-[64ch]):
Short description from Sanity, displayed full (no clamp).

Meta row (Inter 14px, ink-500):
Last published: 2026-04-15 · Version 1.1 · 12 weeks ago
```

The "Back to library" link is hidden on print. The "Print" button is hidden on print.

### Identity Section

```
SECTION HEADING (Fraunces, 24px, ink-900):
Identity.

[Two-column layout, desktop / single column, mobile]

INDICATION CATEGORY (overline label, ink-500)
Pigmentary disorders (body, ink-900)

SPECIFIC INDICATIONS
Post-Inflammatory Hyperpigmentation, Melasma, Lentigines

APPLICABLE FITZPATRICK TYPES
[chip] I  [chip] II  [chip] III  [chip] IV  [chip] V  [chip] VI
(applicable types highlighted in brand-300; non-applicable shown in ink-200)

LAST PUBLISHED
2026-04-15

VERSION
1.1
```

Section dividers: 1px hairline brand-300 at 30% opacity, 60px wide, centered, py-12.

### Clinical Overview Section

```
SECTION HEADING:
Clinical overview.

[Sanity PortableText rendering, prose styling]

Inter 17-18px, line-height 1.7, ink-700, max-w-[64ch]
Headings within the rich text use Fraunces sub-display sizes
Lists, blockquotes, links all styled per design system
```

### Parameter Envelope Section

This is the most clinically critical content. Must be dense, accurate, scannable.

```
SECTION HEADING:
Parameter envelope.

Table layout, full-width:

| Wavelength | Fluence (J/cm²) | Pulse duration (ps) | Spot size (mm) | Fitzpatrick notes |
|------------|-----------------|---------------------|----------------|-------------------|
| 1064 nm    | 1.8 - 2.4       | 450                 | 4 - 6          | Reduce 0.2 J/cm² for Fitz V-VI |
| 532 nm     | 0.4 - 0.6       | 370                 | 3 - 5          | Avoid for Fitz V-VI |
```

**Visual treatment:**
- Headers: Inter overline tracked, ink-500, bold
- Body cells: Inter 15px, ink-900
- Hairline rows between (1px ink-100)
- Padding: py-3 px-4
- **Mobile (<768px):** transposes to vertical layout. Each row becomes a card with "Wavelength: 1064 nm" label-value pairs. No horizontal scroll, ever.

```typescript
// ParameterEnvelopeTable component
// Desktop: render as <table>
// Mobile: render as stacked <dl> blocks per parameter row
// Use CSS @media query, not JS, so it works in print
```

### Session Guidance Section

```
SECTION HEADING:
Session guidance.

EXPECTED SESSIONS         RECOMMENDED SPACING
3 - 6 sessions            6 - 8 weeks between sessions

[Notes — Sanity PortableText, if present]
```

### Biologic Control Section

```
SECTION HEADING:
Biologic control.

[Three-column grid, desktop / stacked, mobile]

PREP                    RECOVERY                MAINTENANCE
Required ✓              Required ✓              Recommended ✓
[brief description]     [brief description]     [brief description]

[Notes — Sanity PortableText, if present]
```

The required/recommended status is a small checkmark icon (Lucide Check) with color: brand-300 if required, ink-300 if not. No "X" mark — absence is shown by absence.

### Contraindications Section

```
SECTION HEADING:
Contraindications.

[Sanity PortableText rendering — typically a bulleted list]

Use a small Lucide AlertCircle icon next to the section heading
(brand-700, not red — clinical reference register, not warning UI)
```

### References Section

```
SECTION HEADING:
References.

[Numbered list — for each reference:]

01. Citation text in Inter regular, ink-700.
    [Optional URL link below citation, ink-500, underlined on hover]

02. Next citation...
```

Use `<ol>` with `list-style: none` and CSS counter for the manual numbering, so print preserves the numbering.

---

## Print Stylesheet (`@media print`)

**Critical — every protocol must print cleanly.**

What's HIDDEN on print:
- Portal navigation chrome (header, sidebar, footer)
- "Back to library" link
- "Print" button
- Hover states, focus rings
- Any decorative gradients or backgrounds
- The sticky filter bar (if user prints from list view)

What changes on print:
- White background, black/dark gray text (ink-900 on white)
- Smaller font sizes (12pt body, 18pt headings)
- Section dividers become solid black hairlines
- Page breaks: avoid breaking inside parameter table rows
- Page-break-before on each major section if doc is long
- Header repeats: protocol title in print page header (using `@page` + `@top-left`)
- Footer repeats: page number + "Precise Aesthetics" in print page footer

```css
@media print {
  /* Hide portal chrome */
  .portal-nav, .portal-sidebar, .portal-footer { display: none; }
  
  /* Hide non-content UI */
  .back-to-library, .print-button { display: none; }
  
  /* Reset for paper */
  body { background: white; color: #000; }
  
  /* Tighter type for paper */
  h1 { font-size: 18pt; }
  h2 { font-size: 14pt; }
  body { font-size: 11pt; line-height: 1.4; }
  
  /* Avoid breaks inside critical content */
  table, .parameter-row, .biologic-control-card {
    break-inside: avoid;
  }
  
  /* Page setup */
  @page {
    margin: 1in;
    @top-left { content: "Precise Aesthetics — Protocol Reference"; }
    @bottom-right { content: counter(page); }
  }
}
```

Test print preview at every common paper size: US Letter (default), A4.

---

## Filter UX Detail

**Filter persistence:** Filters live in URL search params (`?indications=pih,melasma&fitzpatrick=V,VI`). This means:
- Filtered state is shareable via URL
- Browser back/forward works correctly
- Refresh preserves filters

**Filter dropdowns:** Use shadcn `<Popover>` + custom multi-select inside. Show selected count on the trigger button ("Indications · 2 selected").

**Clear filters:** Single action removes all filter params, returns to full library.

**Search debounce:** 300ms before triggering a server roundtrip on search input.

---

## Components List

```
components/portal/protocols/
├── ProtocolLibraryFilters.tsx    (client — search + filter dropdowns)
├── ProtocolCard.tsx              (server — list item)
├── ProtocolReadingView.tsx       (server — orchestrator for detail page)
├── ProtocolReadingHeader.tsx     (server — title block)
├── ParameterEnvelopeTable.tsx    (server — clinical table, responsive)
├── BiologicControlSummary.tsx    (server — three-column grid)
├── ProtocolReferences.tsx        (server — numbered citation list)
├── FitzpatrickChipRow.tsx        (server — I/II/III/IV/V/VI chips, highlighted vs muted)
├── PrintButton.tsx               (client — calls window.print())
└── BackToLibraryLink.tsx         (server — top-of-detail-page nav)
```

---

# PORTAL NAV UPDATE

`/portal` currently lands on a placeholder. After P5:

- Portal sidebar (or top nav, depending on existing P3 implementation) shows "Protocols" as primary item
- "Protocols" should be the most prominent navigation destination
- `/portal` (root) — keep as a minimal dashboard landing for now (welcome message + quick links). Real dashboard lands later.

If portal nav doesn't exist yet from P3, build it minimal here:
- Logo (top-left, links to /portal)
- "Protocols" link
- Practice name + sign-out (top-right)

Reuse the editorial bone-100 + Fraunces register from /admin nav.

---

# VERIFICATION

Before declaring done:

1. `npm run build` clean
2. `npx tsc --noEmit` clean  
3. `npm run lint` clean
4. Manual test sequence (requires test practice + at least one published, device-tagged protocol):
   - Sign in as practice user
   - Visit `/portal/protocols` → see published protocols tagged with owned devices
   - Filter by indication → list updates
   - Filter by Fitzpatrick type → list updates
   - Search by title → list updates with debounce
   - Clear filters → all results return
   - Click a protocol card → land on `/portal/protocols/[slug]`
   - All sections render in correct reading order
   - Sanity rich text renders correctly (overview, biologic notes, contraindications, etc.)
   - Parameter table renders correctly on desktop + iPad + mobile (no horizontal scroll on mobile)
   - Click "Print" button → browser print dialog opens
   - Print preview shows clean clinical document, no portal chrome, page breaks correct
   - Test on physical iPad if available — readable at arm's length, touch targets adequate
5. RLS verification:
   - Sign in as a practice that does NOT own Precise Pico (provision a test practice with no devices)
   - Visit `/portal/protocols` → empty state shows "no protocols available"
   - Try direct URL `/portal/protocols/some-slug` → returns 404 (Supabase query returns no rows due to RLS)
6. Edge cases:
   - Protocol with empty references — section hides
   - Protocol with no clinical overview — section hides
   - Protocol with empty parameter envelope — section hides with caption "Parameters not yet documented"
   - Protocol with no biologic control notes — section still shows the prep/recovery/maintenance status block
7. Lighthouse on `/portal/protocols/[slug]` — 95+ all metrics

---

# PRE-DELIVERY CHECKLIST

- [ ] Tokens-only, no new colors/fonts/icons
- [ ] Single scrollable document on detail view (no tabs, no accordions)
- [ ] Print stylesheet works on US Letter and A4
- [ ] Mobile/iPad parameter table is readable without horizontal scroll
- [ ] All filtering enforces RLS (no bypassing via client-side state)
- [ ] Back-to-library + print button hidden in print
- [ ] All copy [DRAFT]-marked
- [ ] Server Components for content rendering, Client only for filter inputs
- [ ] Reduced motion respected
- [ ] Keyboard navigation works through filters and protocol list
- [ ] Empty states handled (no protocols, no filter matches, no devices owned)
- [ ] Sanity content fetch errors handled gracefully (fallback to "Content unavailable")

---

# DELIVERABLES

When done, report:
1. Production preview URL for `/portal/protocols`
2. Lighthouse scores
3. Components built (list)
4. Drafted copy flagged for approval
5. Print stylesheet test results (US Letter + A4 screenshots if possible)
6. iPad readability test results
7. RLS verification confirmation
8. Decisions made not explicit in spec
9. Anything to verify before P6

After P5 is approved, P6 picks up: treatment logging form + photo upload + adverse event flag + entered-by dropdown.
