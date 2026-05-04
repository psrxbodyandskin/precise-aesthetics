# Session P4 — Protocol Library Schema + Admin CRUD

> Run after P3 (Setup Wizard + Portal Login) is deployed and confirmed working. Builds the protocol library data layer: Sanity schema for authoring, Supabase mirror for queries + RLS, sync webhook, and the admin-side workflow. Sets up the foundation that P5 (portal viewer) reads from.

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/PORTAL-MASTER-SPEC.md`
6. `spec/RLS-PATTERNS.md`
7. This spec

---

## Goal

After this session:
- Sanity schema exists for `protocol` document type with rich content authoring
- Supabase `protocols` table mirrors the Sanity data for fast queries + RLS
- Sanity → Supabase sync runs on Sanity publish events via webhook
- Roni can author protocols in Sanity Studio (rich content, references, attachments)
- Admin Next.js panel surfaces a Supabase-side workflow: device tagging, publish state, version history, audit log
- Draft + published versioning works correctly
- Device-gated access is enforced at the Supabase RLS layer (practitioners only see protocols for devices they own)

P5 (next session) builds the portal-side viewer reading from this foundation.

---

## What Gets Built

### Sanity layer
- New `protocol` document schema with rich text, references, indication tags, Fitzpatrick applicability, parameter envelope, and supporting docs
- New `indicationCategory` schema for taxonomy reference
- Studio updates so Roni can navigate to "Protocols" cleanly
- Publish hooks (Sanity webhooks → our sync endpoint)

### Supabase layer
- `protocols` table — mirror of Sanity published versions with foreign key to Sanity ID
- `protocol_versions` table — immutable snapshots of each published version
- `protocol_devices` table — many-to-many for device gating
- `indication_categories` table — taxonomy mirror for filtering
- RLS policies (Class B — admin-managed shared)

### Sync layer
- Sanity webhook target at `/api/webhooks/sanity/protocol` — handles publish/unpublish events
- Sync function that writes to Supabase, increments version, creates version snapshot
- Verification: Sanity publish → Supabase row appears within 5 seconds

### Admin UI (Next.js side)
- `/admin/protocols` (list view) — all protocols with status, version, indication, devices, last published
- `/admin/protocols/[id]` (detail view) — Sanity content read-only display + Supabase-side device tagging + publish controls + version history + audit log
- "Edit content in Sanity Studio" button → deep-links to Sanity Studio for that document
- Device picker for tagging which devices the protocol applies to
- Publish workflow: confirm dialog → flips status, increments version, creates snapshot

### Audit logging
- Every Supabase-side action logged: device retag, publish, unpublish, archive
- Sanity-side edits handled by Sanity's own revision history (don't double-log)

---

## Critical Constraints

1. **Build on P1+P2+P3 foundation.** Use `requireAdmin()`, follow `RLS-PATTERNS.md` Class B, write through `logAudit()`.
2. **MASTER.md tokens only.** No new colors, fonts, icons.
3. **Sanity is source of truth for content.** Supabase is a query mirror. If they diverge, Sanity wins on resync.
4. **All migrations held for manual review.** Write SQL, do not apply automatically.
5. **Service-role client server-only.** All sync writes happen in API routes behind Sanity webhook auth.
6. **Webhook authentication mandatory.** Sanity webhook must include a shared secret; reject unauthenticated calls.
7. **Idempotent sync.** Publishing the same Sanity document twice should not create duplicate Supabase rows or version snapshots.
8. **Treatment logs (future P6) reference specific versions, not the live row.** Snapshot integrity matters.

---

# DATA MODEL

## Sanity Schema — `protocol` document type

```typescript
// sanity/schemas/protocol.ts
export default {
  name: 'protocol',
  title: 'Protocol',
  type: 'document',
  fields: [
    // Identity
    {
      name: 'title',
      title: 'Protocol title',
      type: 'string',
      validation: Rule => Rule.required().max(160),
    },
    {
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: Rule => Rule.required(),
    },
    {
      name: 'shortDescription',
      title: 'Short description',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.max(300),
      description: 'Surfaced in protocol library list view (1-2 sentences).',
    },

    // Classification
    {
      name: 'indicationCategory',
      title: 'Indication category',
      type: 'reference',
      to: [{ type: 'indicationCategory' }],
      validation: Rule => Rule.required(),
    },
    {
      name: 'indications',
      title: 'Specific indications',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Post-Inflammatory Hyperpigmentation (PIH)', value: 'pih' },
          { title: 'Melasma', value: 'melasma' },
          { title: 'Lentigines', value: 'lentigines' },
          { title: 'Tattoo removal — black ink', value: 'tattoo_black' },
          { title: 'Tattoo removal — colored ink', value: 'tattoo_color' },
          { title: 'Café-au-lait macules', value: 'cafe_au_lait' },
          { title: 'Nevus of Ota', value: 'nevus_ota' },
          { title: "Hori's nevus", value: 'hori' },
          { title: "Becker's nevus", value: 'becker' },
          { title: 'Acne scars', value: 'acne_scars' },
          { title: 'Fine lines & rhytids', value: 'rhytids' },
          { title: 'Skin rejuvenation', value: 'rejuvenation' },
          { title: 'General pigment correction', value: 'pigment_general' },
        ],
      },
    },
    {
      name: 'fitzpatrickTypes',
      title: 'Applicable Fitzpatrick types',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Type I', value: 'I' },
          { title: 'Type II', value: 'II' },
          { title: 'Type III', value: 'III' },
          { title: 'Type IV', value: 'IV' },
          { title: 'Type V', value: 'V' },
          { title: 'Type VI', value: 'VI' },
        ],
      },
      validation: Rule => Rule.min(1),
    },

    // Clinical content
    {
      name: 'overview',
      title: 'Clinical overview',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Longform clinical description. Rich text supported.',
    },
    {
      name: 'parameterEnvelope',
      title: 'Parameter envelope',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'parameterRow',
          fields: [
            { name: 'wavelength', title: 'Wavelength', type: 'string' },
            { name: 'fluenceMin', title: 'Fluence min (J/cm²)', type: 'number' },
            { name: 'fluenceMax', title: 'Fluence max (J/cm²)', type: 'number' },
            { name: 'pulseDuration', title: 'Pulse duration (ps)', type: 'number' },
            { name: 'spotSize', title: 'Spot size (mm)', type: 'string' },
            { name: 'fitzpatrickAdjustment', title: 'Fitzpatrick-specific notes', type: 'text', rows: 2 },
          ],
        },
      ],
    },
    {
      name: 'sessionGuidance',
      title: 'Session guidance',
      type: 'object',
      fields: [
        { name: 'expectedSessions', title: 'Expected number of sessions', type: 'string' },
        { name: 'spacingWeeks', title: 'Recommended spacing (weeks)', type: 'string' },
        { name: 'notes', title: 'Notes', type: 'array', of: [{ type: 'block' }] },
      ],
    },

    // Biologic control
    {
      name: 'prepKitRequired',
      title: 'Prep kit required',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'recoveryKitRequired',
      title: 'Recovery kit required',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'maintenanceKitRecommended',
      title: 'Maintenance kit recommended',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'biologicControlNotes',
      title: 'Biologic control notes',
      type: 'array',
      of: [{ type: 'block' }],
    },

    // Contraindications
    {
      name: 'contraindications',
      title: 'Contraindications',
      type: 'array',
      of: [{ type: 'block' }],
    },

    // Supporting docs
    {
      name: 'supportingDocuments',
      title: 'Supporting documents',
      type: 'array',
      of: [
        {
          type: 'file',
          options: { accept: 'application/pdf' },
        },
      ],
    },
    {
      name: 'references',
      title: 'Clinical references',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'reference',
          fields: [
            { name: 'citation', title: 'Citation', type: 'text', rows: 3 },
            { name: 'url', title: 'URL (optional)', type: 'url' },
          ],
        },
      ],
    },

    // Provenance (read-only in Studio, populated by sync)
    {
      name: 'currentVersion',
      title: 'Current published version',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'lastPublishedAt',
      title: 'Last published',
      type: 'datetime',
      readOnly: true,
    },
  ],
  preview: {
    select: {
      title: 'title',
      version: 'currentVersion',
      indication: 'indicationCategory.title',
    },
    prepare: ({ title, version, indication }) => ({
      title: title || '(untitled)',
      subtitle: `${indication || 'Uncategorized'} · ${version || 'unpublished'}`,
    }),
  },
};
```

## Sanity Schema — `indicationCategory`

```typescript
// sanity/schemas/indicationCategory.ts
export default {
  name: 'indicationCategory',
  title: 'Indication category',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: Rule => Rule.required() },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: 'description', title: 'Description', type: 'text', rows: 3 },
    { name: 'sortOrder', title: 'Sort order', type: 'number', initialValue: 0 },
  ],
};
```

Add both to `sanity.config.ts` schema array.

## Supabase Migration — `0007_protocols.sql`

```sql
-- Indication categories (taxonomy mirror)
create table public.indication_categories (
  id uuid primary key default gen_random_uuid(),
  sanity_id text unique not null,
  title text not null,
  slug text not null unique,
  description text,
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_indication_categories_sort_order 
  on public.indication_categories(sort_order);

-- Protocols (live mirror of Sanity, current published state)
create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  sanity_id text unique not null,
  
  -- Mirrored content
  title text not null,
  slug text not null unique,
  short_description text,
  indication_category_id uuid references public.indication_categories(id),
  indications text[] default '{}',
  fitzpatrick_types text[] default '{}',
  
  -- Status
  status text not null default 'draft' 
    check (status in ('draft', 'published', 'archived')),
  current_version text, -- e.g. '1.0', '1.1', '2.0'
  last_published_at timestamptz,
  last_published_by uuid references auth.users(id),
  
  -- Tracking
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_protocols_status on public.protocols(status);
create index idx_protocols_indication_category on public.protocols(indication_category_id);
create index idx_protocols_indications on public.protocols using gin(indications);
create index idx_protocols_fitzpatrick_types on public.protocols using gin(fitzpatrick_types);
create index idx_protocols_sanity_id on public.protocols(sanity_id);

-- Protocol device tagging (which devices the protocol applies to)
create table public.protocol_devices (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  device_id uuid not null references public.devices(id),
  created_at timestamptz not null default now(),
  unique(protocol_id, device_id)
);

create index idx_protocol_devices_protocol_id on public.protocol_devices(protocol_id);
create index idx_protocol_devices_device_id on public.protocol_devices(device_id);

-- Protocol versions (immutable snapshots of published state)
create table public.protocol_versions (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  version text not null, -- '1.0', '1.1', '2.0'
  
  -- Snapshotted content (everything practitioners need to reference)
  title text not null,
  short_description text,
  indication_category_sanity_id text,
  indications text[] default '{}',
  fitzpatrick_types text[] default '{}',
  
  -- Full Sanity payload at the moment of publish (for treatment-log reference integrity)
  sanity_snapshot jsonb,
  
  -- Provenance
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id),
  
  unique(protocol_id, version)
);

create index idx_protocol_versions_protocol_id on public.protocol_versions(protocol_id);
create index idx_protocol_versions_published_at on public.protocol_versions(published_at desc);

-- Updated_at triggers
create trigger trg_indication_categories_updated_at
  before update on public.indication_categories
  for each row execute function public.set_updated_at();

create trigger trg_protocols_updated_at
  before update on public.protocols
  for each row execute function public.set_updated_at();

-- RLS policies (Class B — admin-managed shared)
alter table public.indication_categories enable row level security;
alter table public.protocols enable row level security;
alter table public.protocol_devices enable row level security;
alter table public.protocol_versions enable row level security;

-- indication_categories: admin all, practice read all
create policy ic_admin_all on public.indication_categories
  for all using (public.is_admin()) with check (public.is_admin());
create policy ic_practice_read on public.indication_categories
  for select using (public.is_practice());

-- protocols: admin all, practice read published + device-gated
create policy protocols_admin_all on public.protocols
  for all using (public.is_admin()) with check (public.is_admin());

create policy protocols_practice_read_device_gated on public.protocols
  for select using (
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

-- protocol_devices: admin all, practice read for their visible protocols
create policy pd_admin_all on public.protocol_devices
  for all using (public.is_admin()) with check (public.is_admin());

create policy pd_practice_read on public.protocol_devices
  for select using (
    public.is_practice()
    and exists (
      select 1
      from public.practice_devices prd
      where prd.device_id = protocol_devices.device_id
        and prd.practice_id = public.current_practice_id()
    )
  );

-- protocol_versions: admin all, practice read for protocols they can see
create policy pv_admin_all on public.protocol_versions
  for all using (public.is_admin()) with check (public.is_admin());

create policy pv_practice_read on public.protocol_versions
  for select using (
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
```

---

# SYNC LAYER

## Sanity Webhook → `/api/webhooks/sanity/protocol`

**File:** `app/api/webhooks/sanity/protocol/route.ts`

**POST handler:**
1. Verify `Sanity-Webhook-Signature` header against `SANITY_WEBHOOK_SECRET` env var
2. Parse payload — Sanity sends document data on publish/unpublish
3. Branch on event type:
   - **Publish**: upsert `protocols` row from Sanity payload, increment version, create new `protocol_versions` snapshot
   - **Unpublish**: set `protocols.status = 'archived'` (do NOT delete; treatment_logs may reference it)
   - **Delete**: only allowed if no `treatment_logs` reference any version. Otherwise reject with 409.

**Idempotency:**
- Use Sanity document `_id` as the unique key
- Use Sanity `_rev` to detect duplicate webhook deliveries
- Store `last_synced_rev` on `protocols` row, skip sync if rev matches

**Version increment logic:**
- New protocol (no existing row): start at `1.0`
- Existing protocol, content change without breaking parameter envelope: increment minor (`1.0` → `1.1`)
- Manual major bump from admin UI before publish: increment major (`1.5` → `2.0`)
- This logic lives in `lib/admin/protocols-sync.ts`

**File:** `lib/admin/protocols-sync.ts`
- `syncProtocolFromSanity(sanityDoc)` — main entry point
- `incrementVersion(currentVersion, bumpType)` — helper
- `createVersionSnapshot(protocolId, sanityPayload, version)` — writes immutable snapshot
- All called from inside the webhook route, server-only

## Sanity Studio webhook configuration

After deploying the webhook endpoint, add to Sanity:
- Studio → Manage → API → Webhooks → Add
- Trigger: `On publish` and `On unpublish`
- Filter: `_type == "protocol"`
- HTTP method: POST
- URL: `https://preciseaesthetics.com/api/webhooks/sanity/protocol`
- HTTP headers: include shared secret
- Document projection: include all fields (no projection filter)

Document this setup in `spec/SANITY-WEBHOOK-SETUP.md` for future reference.

---

# ADMIN UI

## Route: `/admin/protocols` (list)

**Layout:**
- Page header: eyebrow `§ ADMIN`, h1 `Protocols`, lead `Manage the protocol library. Authoring lives in Sanity Studio; publishing and device tagging happen here.`
- Top bar:
  - Search input (filters by title)
  - Status filter dropdown (all / draft / published / archived)
  - Indication filter dropdown (populated from `indication_categories`)
  - "Open Sanity Studio" link button (top-right, secondary) → /studio
- Table columns:
  - Title
  - Indication category
  - Status (StatusChip from P2)
  - Current version
  - Devices (chip stack)
  - Last published
  - Actions (kebab → View / Open in Studio / Publish / Unpublish / Archive)
- Click row → `/admin/protocols/[id]`
- Empty state: "No protocols yet. Author the first one in Sanity Studio."
- Pagination: 50 per page

## Route: `/admin/protocols/[id]` (detail)

**Layout:**

Top section (header):
- Breadcrumb: `Protocols › {protocol title}`
- Eyebrow: `§ {indication_category.title}`
- H1: protocol title (Fraunces, large)
- Status chip + current version + last published timestamp
- Action buttons (right-aligned):
  - "Edit content in Sanity Studio" (primary, opens deep-link to Studio document)
  - "Publish" (if status=draft) / "Unpublish" (if status=published)
  - "Archive" (always available, confirmation required)

Body — sectioned layout:

**Section A — Sanity content preview (read-only)**
Renders the Sanity content for review. Practitioners will see this same content in P5.
- Short description
- Clinical overview (PortableText render)
- Parameter envelope (table render of the parameterRow array)
- Session guidance
- Biologic control notes
- Contraindications
- References

This is read-only here. Editing happens in Sanity Studio. Include a small "Edit in Studio →" link at the top of the content section for context-aware deep-link.

**Section B — Device tagging (Supabase-side, editable)**
- Multi-select picker showing all active devices
- Tagged devices shown as chips with × to remove
- Save on change → PATCH `/api/admin/protocols/[id]/devices`
- Audit log entry on every change

**Section C — Version history**
- List of all `protocol_versions` for this protocol, newest first
- Per row: version number, published_at, published_by (user email)
- Click row → modal showing full snapshot diff vs current (basic JSON diff is fine for P4; richer diff is a polish item)

**Section D — Audit log**
- Filtered to `audit_log` rows where `target_type = 'protocol'` and `target_id = protocol.id`
- Reuse `AuditLogTable` from P2
- Limited to most recent 50 entries

**Section E — Sync status**
- Last synced from Sanity (timestamp)
- Last synced rev
- "Force resync from Sanity" button (admin-only) → calls a dedicated endpoint that re-fetches the document and reruns sync
- Useful if a webhook delivery failed silently

---

# API ROUTES

## `app/api/admin/protocols/route.ts`
- `GET` — list with filters (status, indication, search), pagination

## `app/api/admin/protocols/[id]/route.ts`
- `GET` — full detail including Sanity content fetch + Supabase metadata + version history + audit log

## `app/api/admin/protocols/[id]/devices/route.ts`
- `PATCH` — update device tagging
  - Validate: at least 1 device (otherwise no practice can ever see it)
  - Replace strategy: delete all existing protocol_devices for this protocol, insert new set
  - Audit log entry

## `app/api/admin/protocols/[id]/publish/route.ts`
- `POST` — publish a draft protocol
  - Confirmation required (UI side)
  - Triggers version increment + snapshot creation
  - Updates `protocols.status` = `published`, `last_published_at`, `last_published_by`
  - Audit log

## `app/api/admin/protocols/[id]/unpublish/route.ts`
- `POST` — unpublish a published protocol
  - Sets `protocols.status` = `draft`
  - Does NOT delete versions — practitioners still see the most recent published version until republished
  - Wait — actually, RLS only shows `status = 'published'` rows. Unpublishing makes the protocol invisible to practitioners until republished.
  - Audit log

## `app/api/admin/protocols/[id]/archive/route.ts`
- `POST` — archive (soft delete)
  - Sets `status = 'archived'`
  - Treatment logs that reference this protocol's versions still work (versions table is untouched)
  - Audit log

## `app/api/admin/protocols/[id]/resync/route.ts`
- `POST` — force resync from Sanity
  - Fetches current Sanity document by ID
  - Runs sync logic
  - Useful for recovering from missed webhooks

---

# SCHEMA + TYPES

## `lib/schemas/protocol.ts`

```typescript
import { z } from 'zod';

export const protocolStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ProtocolStatus = z.infer<typeof protocolStatusSchema>;

export const protocolDeviceTagsSchema = z.object({
  deviceIds: z.array(z.string().uuid()).min(1, 'Tag at least one device'),
});

export type ProtocolDeviceTagsValues = z.infer<typeof protocolDeviceTagsSchema>;
```

## `lib/supabase/types.ts`
Add types for new tables:
- `indication_categories`
- `protocols`
- `protocol_devices`
- `protocol_versions`

## `lib/admin/protocols.ts` (server-only data layer)
- `listProtocols({ status, indication, search, page })`
- `getProtocolById(id)` — joins Sanity content + Supabase metadata
- `updateProtocolDevices(id, deviceIds)`
- `publishProtocol(id)` — calls into sync layer
- `unpublishProtocol(id)`
- `archiveProtocol(id)`
- `forceResyncProtocol(id)` — re-fetches from Sanity

## `lib/sanity/protocols.ts` (Sanity client wrapper)
- `fetchProtocolFromSanity(sanityId)` — full document with PortableText
- `fetchProtocolListFromSanity()` — used for resync operations
- Use existing Sanity client from previous sessions

---

# COMPONENTS

**`components/admin/protocols/ProtocolsTable.tsx`** — list view, similar to PracticesTable
**`components/admin/protocols/ProtocolDetailView.tsx`** — full detail page
**`components/admin/protocols/ProtocolContentPreview.tsx`** — read-only PortableText rendering of Sanity content
**`components/admin/protocols/ProtocolParameterTable.tsx`** — table render of parameterRow[]
**`components/admin/protocols/DeviceTagPicker.tsx`** — multi-select for device tagging
**`components/admin/protocols/VersionHistoryList.tsx`** — list of version snapshots
**`components/admin/protocols/PublishConfirmationDialog.tsx`** — confirmation modal for publish action

Add "Protocols" to `AdminSidebar.tsx` NAV_ITEMS, between Dashboard and Practices.

---

# ENVIRONMENT VARIABLES

New env var required:

```
SANITY_WEBHOOK_SECRET=<generate random string>
```

Document in `.env.example` and `CLAUDE.md`.

Configure on Vercel + locally + add to Sanity webhook headers.

---

# VERIFICATION

Before declaring done:

1. `npm run build` clean — admin protocol routes generate
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Migration written, NOT applied to prod (held for manual review)
5. Sanity schema deployable to Studio — confirm Studio loads with new "Protocol" and "Indication category" sections in nav
6. Manual test sequence (after migration applied + Sanity schema deployed):
   - In Sanity Studio, create an indication category "Pigmentary disorders"
   - Configure Sanity webhook to point at the local dev tunnel or staging
   - Sync indication category to Supabase manually first time (via resync endpoint)
   - In Sanity Studio, create a draft Protocol document with all fields populated
   - Publish in Studio → webhook fires → check Supabase: protocol row appears, version 1.0 snapshot created
   - In `/admin/protocols`, see the new protocol listed with status=published
   - Tag the protocol with Precise Pico via the device picker
   - Edit the Sanity document → republish → check Supabase: version 1.1 snapshot created
   - Click "Force resync" → confirm idempotent (no duplicate version)
   - Unpublish via admin UI → status flips to draft → protocol disappears from practitioner-visible queries (test by querying as a practice user)
   - Archive → status flips to archived
7. Verify RLS:
   - Sign in as a practice user (created in P2/P3)
   - Query protocols directly via Supabase — should only see published protocols tagged with devices the practice owns
   - Query a protocol the practice doesn't own the device for — should return zero rows
8. Reduced motion respected
9. Tab navigation through admin pages works keyboard-only

---

# PRE-DELIVERY CHECKLIST

- [ ] Sanity schemas deployable, Studio loads cleanly
- [ ] Migration file written, held for manual review
- [ ] Webhook endpoint authenticated via shared secret
- [ ] Webhook idempotent (handles duplicate deliveries)
- [ ] Sync logic handles new protocol, content edit, manual major bump, unpublish, delete-with-references-rejection
- [ ] RLS verified — practitioners only see published + device-gated
- [ ] All admin writes hit `logAudit()`
- [ ] Service-role client server-only
- [ ] Force resync endpoint works
- [ ] Reuse existing primitives (StatusChip, AuditLogTable, AdminPageHeader, etc.) — no new versions of those
- [ ] All copy `[DRAFT]`-marked

---

# DELIVERABLES

When done, report:
1. Files created/modified (Sanity schemas, Supabase migration, sync layer, admin UI)
2. Migration SQL location + Sanity schema deployment steps
3. SANITY_WEBHOOK_SECRET env var setup instructions
4. Sanity webhook configuration steps (for me to do in Sanity Studio)
5. Manual test sequence results
6. RLS verification confirmation
7. Drafted copy flagged for approval
8. Decisions made not explicit in spec
9. Anything to verify before P5

After P4 is approved + migrated + Sanity webhook configured, P5 picks up: portal-side protocol library viewer.
