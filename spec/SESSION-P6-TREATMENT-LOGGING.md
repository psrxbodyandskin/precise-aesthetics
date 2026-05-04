# Session P6 — Treatment Logging

> Run after P5 (Protocol Library Viewer) is deployed and confirmed working. Builds the practitioner-facing treatment logging form. This is the data-input surface that feeds the Data Intelligence Layer — every field practitioners log becomes input that refines the system over time.

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
9. This spec

---

## The Use Case

Treatment just finished. Patient has left the chair. The practitioner sits down at the iPad and logs the session. Total time budget: **60-90 seconds.** Anything longer and practitioners stop logging.

This is not an EMR. Practitioners track full patient records in their own systems. This is the **system contribution interface** — lightweight, focused, designed to capture only what feeds pattern recognition and protocol refinement.

Every field on this form must justify its existence by:
1. Feeding clinical pattern detection (parameters, outcomes, adverse events)
2. Identifying protocol refinement opportunities (deviations, results)
3. Enabling the Data Intelligence Layer's promise

If a field doesn't serve those, it's cut.

---

## Goal

After this session:
- Practitioner can log a completed treatment in 60-90 seconds
- Treatment captures: protocol used, patient context (de-identified), parameters delivered, outcome flags, optional photos, adverse event flag with description
- "Entered by" dropdown sources from `practice_authorized_users` (P3)
- Photos upload to Supabase Storage with practice-level RLS
- Adverse events trigger email to admin + flag in admin panel
- Form lives at `/portal/treatments/new`
- Treatment list view at `/portal/treatments` (read-only, P7 builds the full history view)
- All access enforced by RLS — practices write/read their own treatments only

---

## What Gets Built

### Routes
- `/portal/treatments` — list of practice's logged treatments (basic list for P6, full history view in P7)
- `/portal/treatments/new` — logging form
- `/portal/treatments/[id]` — single treatment view (read-only, used after submission)

### Database
- `treatments` table — main log record
- `treatment_photos` table — photo metadata (file in Supabase Storage)
- `treatment_adverse_events` table — adverse event flag + description (separate table for clean RLS + admin querying)
- Storage bucket: `treatment-photos`

### Components
- Treatment logging form (multi-section, single page)
- Photo uploader with drag-drop + preview + EXIF strip
- Adverse event toggle + conditional textarea
- Entered-by dropdown + inline "Add user" (writes to `practice_authorized_users`)
- Protocol version selector (queries P4 protocols, locks the version reference)
- Parameter input fields (validates against the protocol's parameter envelope)

### API + email
- `POST /api/portal/treatments` — create treatment + photos + adverse event in transaction
- `POST /api/portal/practice-users` — practice self-management of authorized users
- Adverse event email to admin via Resend (existing pattern)

### Admin side
- "Adverse Events" section added to admin sidebar (between Practices and Protocols)
- `/admin/adverse-events` list view of flagged events
- `/admin/adverse-events/[id]` detail view with status workflow

---

## Critical Constraints

1. **Build on P1+P2+P3+P4+P5 foundation.** Use `requirePractice()` for portal, `requireAdmin()` for admin, RLS Class A for treatment data, RLS Class C for adverse events admin view.
2. **MASTER.md tokens only.** No new colors, fonts, icons.
3. **Form completion target: 60-90 seconds.** Every field optimized for speed. No unnecessary scrolling, no multi-step wizard for the regular flow.
4. **Mobile/iPad first.** Practitioners log from the chair. Touch-friendly inputs, keyboard-aware layouts, no horizontal scroll.
5. **Photos optional, not required.** Skipping photos doesn't block submission.
6. **EXIF data stripped on upload.** Patient location, time, device data must not be stored.
7. **Patient consent affirmed at upload.** Single checkbox, required when photos are attached.
8. **Treatment references locked protocol version.** When practitioner selects a protocol, the form stamps the current published version. If protocol updates later, this treatment still references the version that was active at log time.
9. **Adverse event = simple.** Yes/No toggle + free-text description if yes. No severity classification, no category dropdown. Email to admin + admin panel flag.
10. **All migrations held for manual review.**

---

# DATA MODEL

## Migration: `0008_treatments.sql`

```sql
-- Main treatment log
create table public.treatments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Practice context (RLS pivot)
  practice_id uuid not null references public.practices(id) on delete cascade,
  
  -- Who entered this log (sourced from practice_authorized_users dropdown)
  entered_by_user_id uuid references public.practice_authorized_users(id),
  entered_by_name text not null, -- denormalized snapshot — survives if user record changes

  -- Treatment date (may differ from created_at if logged later)
  treatment_date date not null,

  -- Protocol reference (version-locked)
  protocol_id uuid not null references public.protocols(id),
  protocol_version_id uuid not null references public.protocol_versions(id),
  protocol_version_label text not null, -- e.g. "1.1" — denormalized for display
  
  -- Optional protocol deviation
  protocol_deviation boolean not null default false,
  protocol_deviation_reason text, -- required if protocol_deviation = true

  -- Patient context (de-identified)
  patient_anon_id text, -- practice-generated anon code, optional, max 40 chars
  patient_age_range text check (patient_age_range in (
    'under_18', '18_25', '26_35', '36_45', '46_55', '56_65', 'over_65'
  )),
  patient_fitzpatrick text not null check (patient_fitzpatrick in (
    'I', 'II', 'III', 'IV', 'V', 'VI'
  )),
  patient_sex text check (patient_sex in ('female', 'male', 'other', 'undisclosed')),

  -- Treatment context
  indication text not null, -- references protocol's indication category
  treatment_site text, -- free-text body area
  session_number integer not null check (session_number > 0),

  -- Parameters delivered (denormalized capture per session)
  wavelength_nm integer,
  fluence_j_per_cm2 numeric(5,2),
  pulse_duration_ps integer,
  spot_size_mm numeric(4,1),
  total_pulses integer,
  treatment_duration_minutes integer,

  -- Biologic control
  prep_kit_used boolean not null default false,
  recovery_kit_dispensed boolean not null default false,
  maintenance_kit_recommended boolean not null default false,

  -- Practitioner notes
  notes text,

  -- Outcome (initial — may be updated later when practitioner logs follow-up; P7 handles)
  has_followup boolean not null default false,
  followup_completed_at timestamptz
);

create index idx_treatments_practice_id on public.treatments(practice_id);
create index idx_treatments_protocol_id on public.treatments(protocol_id);
create index idx_treatments_treatment_date on public.treatments(treatment_date desc);
create index idx_treatments_indication on public.treatments(indication);
create index idx_treatments_fitzpatrick on public.treatments(patient_fitzpatrick);

-- Updated_at trigger
create trigger trg_treatments_updated_at
  before update on public.treatments
  for each row execute function public.set_updated_at();

-- Treatment photos (metadata; files in Supabase Storage)
create table public.treatment_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,
  
  storage_path text not null, -- bucket path
  filename text not null,
  mime_type text not null,
  byte_size integer not null,
  
  capture_phase text check (capture_phase in ('before', 'during', 'after', 'followup')),
  caption text,
  
  -- Patient consent affirmed at upload
  consent_affirmed boolean not null default false
);

create index idx_treatment_photos_treatment_id on public.treatment_photos(treatment_id);
create index idx_treatment_photos_practice_id on public.treatment_photos(practice_id);

-- Adverse events (separate table for clean admin queries + RLS)
create table public.treatment_adverse_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,
  
  description text not null,
  
  -- Admin workflow status
  status text not null default 'new' check (status in (
    'new', 'reviewing', 'addressed'
  )),
  status_changed_at timestamptz default now(),
  status_changed_by uuid references auth.users(id),
  admin_notes text
);

create index idx_adverse_events_status on public.treatment_adverse_events(status);
create index idx_adverse_events_practice_id on public.treatment_adverse_events(practice_id);
create index idx_adverse_events_created_at on public.treatment_adverse_events(created_at desc);

create trigger trg_adverse_events_updated_at
  before update on public.treatment_adverse_events
  for each row execute function public.set_updated_at();

-- RLS policies
alter table public.treatments enable row level security;
alter table public.treatment_photos enable row level security;
alter table public.treatment_adverse_events enable row level security;

-- treatments: Class A — practice CRUD own, admin all
create policy treatments_admin_all on public.treatments
  for all using (public.is_admin()) with check (public.is_admin());

create policy treatments_practice_crud_own on public.treatments
  for all using (
    public.is_practice() 
    and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

-- treatment_photos: same Class A pattern
create policy treatment_photos_admin_all on public.treatment_photos
  for all using (public.is_admin()) with check (public.is_admin());

create policy treatment_photos_practice_crud_own on public.treatment_photos
  for all using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

-- treatment_adverse_events: practice writes own (insert via treatment submission); admin reads all + manages status
create policy adverse_events_admin_all on public.treatment_adverse_events
  for all using (public.is_admin()) with check (public.is_admin());

create policy adverse_events_practice_insert_own on public.treatment_adverse_events
  for insert with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

create policy adverse_events_practice_read_own on public.treatment_adverse_events
  for select using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

-- Practices cannot update or delete adverse events — admin only manages status
```

## Storage Bucket: `treatment-photos`

```sql
-- Run in Supabase SQL editor (cannot be in migration file as bucket creation requires storage admin)
insert into storage.buckets (id, name, public)
values ('treatment-photos', 'treatment-photos', false);

-- Storage RLS — practice can read/write photos under their own practice_id path
create policy "Practice can upload own treatment photos"
on storage.objects for insert
with check (
  bucket_id = 'treatment-photos'
  and (storage.foldername(name))[1] = public.current_practice_id()::text
);

create policy "Practice can read own treatment photos"
on storage.objects for select
using (
  bucket_id = 'treatment-photos'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = public.current_practice_id()::text
  )
);

create policy "Practice can delete own treatment photos"
on storage.objects for delete
using (
  bucket_id = 'treatment-photos'
  and (storage.foldername(name))[1] = public.current_practice_id()::text
);
```

**Path structure:** `{practice_id}/{treatment_id}/{uuid}-{original_filename}`

---

# THE FORM

## Route: `/portal/treatments/new`

**File:** `app/(portal)/portal/treatments/new/page.tsx`

**Layout:**

Single page, single column, max-w-[720px], centered. No multi-step wizard. All fields visible at once with section dividers for visual rhythm.

**Page header:**
- Eyebrow: `§ NEW TREATMENT`
- H1: `Log a treatment.`
- Lead: `Capture the session details. Estimated time: 60-90 seconds.`

**Progress indicator (subtle):**
A thin progress bar (1px hairline at top of form) that fills from left to right based on % of required fields completed. Practitioners see how close they are to submission without it being intrusive. brand-300 fill, ink-100 background.

## Form Sections

Each section is visually separated by a 60px hairline divider (1px brand-300 at 30%) with a small section heading above. No accordions, no collapse — everything visible.

### Section 1 — Who entered this?

Topmost. Critical for attribution.

```
[Section heading, Inter overline tracked, ink-500]
ENTERED BY

[Dropdown — Select primitive from shadcn]
Choose a user
  ↓
  • Dr. Smith — Practitioner
  • NP Jones — Practitioner
  • Jane Reed — MA
  ───────
  + Add a new user

[Helper text below dropdown, Inter 13px, ink-500]
The list is managed by your practice. Add new users as needed.
```

When "+ Add a new user" is clicked → inline modal:
- Full name (required)
- Role at practice (free text, optional, with suggested chips: Practitioner, MA, Front desk)
- Save → writes to `practice_authorized_users`, dropdown updates, new user pre-selected

Required field. Cannot submit without selecting.

### Section 2 — Treatment date

```
[Section heading]
TREATMENT DATE

[Date picker, defaults to today]
2026-05-03

[Helper text]
When did the treatment occur?
```

Required. Defaults to today. Allow past dates (practitioners may log from notes after the fact). Disallow future dates.

### Section 3 — Protocol used

```
[Section heading]
PROTOCOL

[Searchable select — populated from protocols visible to this practice via RLS]
Search protocols...
  ↓
  Pigmentary disorders
    Melasma — Fitzpatrick IV-VI (v1.1)
    PIH Prevention Protocol™ (v2.0)
    Lentigines (v1.0)
  Tattoo removal
    Black ink — multi-session (v1.2)
    Colored ink — staged approach (v1.0)

[After selection, locked version chip appears]
Selected: Melasma — Fitzpatrick IV-VI · v1.1 (locked)
```

When practitioner selects a protocol, the current published `protocol_version_id` is captured and locked into the treatment record. Even if the protocol updates later, this treatment references v1.1.

Required field.

**Optional deviation toggle:**
```
[Checkbox]
☐ I deviated from this protocol

[If checked, textarea appears]
Reason for deviation
[Patient declined recommended fluence, started at 1.6 J/cm²]
```

### Section 4 — Patient context (de-identified)

```
[Section heading]
PATIENT CONTEXT

Optional anonymous patient ID
[your-internal-code or skip]

[Helper text]
Optional. Used for series tracking on your end. Not stored as 
patient identification.

Age range *
[Dropdown: Under 18, 18-25, 26-35, 36-45, 46-55, 56-65, Over 65]

Fitzpatrick type *
[Six chip buttons: I  II  III  IV  V  VI]

Sex (optional)
[Four chip buttons: Female  Male  Other  Undisclosed]
```

Fitzpatrick required. Age range required. Sex optional. Anon ID optional.

### Section 5 — Treatment context

```
[Section heading]
TREATMENT CONTEXT

Indication *
[Dropdown — populated from selected protocol's indications]
- Melasma
- PIH

Treatment site
[Free text]
Cheeks and forehead

Session number *
[Number input, min 1]
3
```

Indication pre-filtered by selected protocol. Defaults to first if only one. Required.

Treatment site is free text. Optional but recommended.

Session number required, defaults to 1.

### Section 6 — Parameters delivered

```
[Section heading]
PARAMETERS DELIVERED

[Helper text below heading]
Capture the actual parameters used. The protocol's recommended 
range is shown for reference.

[Inline reference, Inter 13px, ink-500, italic]
Recommended for v1.1: 1064 nm · 1.8-2.4 J/cm² · 450 ps · 4-6 mm

[Two-column grid on desktop, single column on mobile]

Wavelength (nm) *           Fluence (J/cm²) *
[1064]                      [2.0]

Pulse duration (ps)         Spot size (mm)
[450]                       [5]

Total pulses                Treatment duration (minutes)
[450]                       [12]
```

Wavelength + fluence required (most clinically meaningful). Others optional but encouraged.

If fluence falls outside the protocol's recommended range, a soft warning appears below the field: "Outside recommended range. Confirm intentional." (Doesn't block submission.)

### Section 7 — Biologic control

```
[Section heading]
BIOLOGIC CONTROL

[Three checkboxes, vertical stack]
☐ Prep kit used
☐ Recovery kit dispensed
☐ Maintenance kit recommended
```

All optional. Defaults follow the protocol's required flags (e.g. if protocol requires prep, checkbox pre-checked but practitioner can uncheck).

### Section 8 — Photos (optional)

```
[Section heading]
PHOTOS

[Helper text]
Optional. Photos help track progress and contribute to outcome 
pattern recognition. Patient consent must be affirmed before 
upload.

[Drop zone — drag-drop area, click to select files]
Drop photos here or click to upload
JPG, PNG, HEIC. Up to 10MB per file.

[After files added, list of photo cards]
[ Photo thumbnail | Filename | Phase dropdown (before/during/after/followup) | Caption | Remove ]

[Consent checkbox — only required if photos attached]
☐ I confirm I have obtained patient consent for clinical photos.
```

**Upload flow:**
1. Practitioner drops/selects images
2. Client-side: strip EXIF data using `exifr` or similar
3. Client-side: generate preview
4. On form submit: photos upload to `treatment-photos` bucket at path `{practice_id}/{treatment_id}/{uuid}-{filename}`
5. Photo metadata written to `treatment_photos` table

Consent checkbox only required if 1+ photos attached.

### Section 9 — Notes

```
[Section heading]
NOTES (OPTIONAL)

[Textarea, 4 rows]
Patient tolerated well. Recommended 6-week spacing for next 
session.
```

Optional. Free text.

### Section 10 — Adverse reaction

```
[Section heading]
ADVERSE REACTION

[Toggle — Yes/No]
Did this treatment cause an adverse reaction?
○ No   ● Yes

[If Yes, textarea appears]
Describe what happened *
[Patient experienced unexpected redness lasting 48+ hours, 
treated with topical steroid, resolved by day 4.]
```

Default: No. If Yes, description required.

If yes on submission:
- Row inserted into `treatment_adverse_events`
- Email sent to admin via Resend (uses existing email infrastructure)
- Admin panel "Adverse Events" section shows new flagged event

### Submit

```
[Footer area]
[Submit button — primary, large]
Log treatment

[Helper text below button]
Treatment will be saved to your practice's record and contribute 
to system-wide pattern recognition.
```

Submit behavior:
- Loading state on button ("Logging..." with spinner)
- Form validation runs client + server side
- If photos attached: upload starts, progress indicator per photo
- On success: redirect to `/portal/treatments/[id]` with success toast
- On error: Sonner toast with error message, form preserved (no data loss)

---

# COMPONENTS

```
components/portal/treatments/
├── TreatmentLogForm.tsx           (orchestrator, RHF + Zod, all sections)
├── EnteredByDropdown.tsx          (Select with "Add new user" inline modal)
├── AddAuthorizedUserModal.tsx     (writes to practice_authorized_users)
├── ProtocolSelector.tsx           (searchable select, pre-filters by RLS-visible protocols)
├── ProtocolDeviationField.tsx     (checkbox + conditional textarea)
├── PatientContextSection.tsx      (anon ID + age + Fitzpatrick + sex)
├── ParameterFields.tsx            (wavelength/fluence/pulse/spot inputs with reference)
├── BiologicControlCheckboxes.tsx  
├── PhotoUploader.tsx              (drag-drop + EXIF strip + previews + consent)
├── AdverseReactionField.tsx       (toggle + conditional textarea)
└── ProgressIndicator.tsx          (subtle top hairline filling based on completion %)
```

Photo upload uses `exifr` for EXIF stripping (client-side, runs in browser before upload). Add to dependencies.

---

# API ROUTES

## `app/api/portal/treatments/route.ts`

**POST** — Create treatment with photos and adverse event in transaction

1. `requirePractice()`
2. Parse multipart form data (form fields + photo files)
3. Validate with Zod
4. Server-side: re-verify protocol_id maps to a protocol_version_id the practice can see (RLS)
5. Insert treatment row
6. If photos attached:
   - Upload each to Supabase Storage
   - Insert `treatment_photos` rows
7. If adverse_event_yes:
   - Insert `treatment_adverse_events` row
   - Trigger email to admin via Resend
8. Audit log entry: `treatment.logged`
9. Return treatment ID for redirect

**GET** — List treatments for current practice (used by `/portal/treatments` list page)

## `app/api/portal/practice-users/route.ts`

**POST** — Add new authorized user
**GET** — List practice's authorized users
**DELETE** — Soft-delete (set `is_active = false`)

All require `requirePractice()`. RLS handles ownership.

---

# ZOD SCHEMA

## `lib/schemas/treatment.ts`

```typescript
import { z } from "zod";

export const treatmentLogSchema = z.object({
  enteredByUserId: z.string().uuid(),
  treatmentDate: z.string(), // ISO date
  
  protocolId: z.string().uuid(),
  protocolVersionId: z.string().uuid(),
  protocolDeviation: z.boolean(),
  protocolDeviationReason: z.string().optional(),
  
  patientAnonId: z.string().max(40).optional(),
  patientAgeRange: z.enum([
    'under_18', '18_25', '26_35', '36_45', '46_55', '56_65', 'over_65'
  ]),
  patientFitzpatrick: z.enum(['I', 'II', 'III', 'IV', 'V', 'VI']),
  patientSex: z.enum(['female', 'male', 'other', 'undisclosed']).optional(),
  
  indication: z.string(),
  treatmentSite: z.string().max(200).optional(),
  sessionNumber: z.number().int().min(1),
  
  wavelengthNm: z.number().int().optional(),
  fluenceJPerCm2: z.number().optional(),
  pulseDurationPs: z.number().int().optional(),
  spotSizeMm: z.number().optional(),
  totalPulses: z.number().int().optional(),
  treatmentDurationMinutes: z.number().int().optional(),
  
  prepKitUsed: z.boolean(),
  recoveryKitDispensed: z.boolean(),
  maintenanceKitRecommended: z.boolean(),
  
  notes: z.string().max(4000).optional(),
  
  adverseReaction: z.boolean(),
  adverseReactionDescription: z.string().optional(),
  
  // Photo metadata (files come separately as multipart)
  photoMetadata: z.array(z.object({
    filename: z.string(),
    capturePhase: z.enum(['before', 'during', 'after', 'followup']).optional(),
    caption: z.string().max(500).optional(),
  })).optional(),
  
  consentAffirmed: z.boolean(),
}).refine(
  (data) => !data.protocolDeviation || data.protocolDeviationReason,
  { message: "Deviation reason required", path: ['protocolDeviationReason'] }
).refine(
  (data) => !data.adverseReaction || data.adverseReactionDescription,
  { message: "Description required", path: ['adverseReactionDescription'] }
).refine(
  (data) => !data.photoMetadata?.length || data.consentAffirmed,
  { message: "Patient consent required for photos", path: ['consentAffirmed'] }
);

export type TreatmentLogValues = z.infer<typeof treatmentLogSchema>;
```

---

# EMAIL TEMPLATES

## `emails/AdverseEventNotification.tsx`

Sent to admin (RESEND_INTERNAL_NOTIFY_EMAIL) when an adverse event is flagged.

**From:** RESEND_FROM_EMAIL  
**Subject:** Adverse event reported — {practiceName}  
**Preview:** A new adverse event has been logged for clinical review.

**Body:**
```
A new adverse event has been logged for clinical review.

Practice: {practiceName}
Date: {treatmentDate}
Protocol: {protocolTitle} (v{version})
Indication: {indication}
Patient Fitzpatrick: {fitzpatrick}
Entered by: {enteredByName}

Description:
{adverseReactionDescription}

Review and update status in the admin panel:
[View in admin] → /admin/adverse-events/{id}

— Precise Aesthetics System Notification
```

Plain bone-100 background, navy lockup at top, no decorative imagery, system-first voice. Matches existing internal notification email register.

---

# ADMIN SIDE — Adverse Events

## Sidebar update

Add to `AdminSidebar.tsx` NAV_ITEMS:
- New entry: "Adverse Events" between "Practices" and "Protocols"
- Route: `/admin/adverse-events`
- Icon: Lucide `AlertCircle`
- Badge: count of `status='new'` adverse events (queried in layout, refreshed on navigation)

## Route: `/admin/adverse-events`

**Purpose:** Triage queue for adverse events.

**Layout:**
- Page header: eyebrow `§ ADMIN`, h1 `Adverse Events`, lead `Review reported adverse reactions across all practices.`
- Filter bar: status dropdown (new / reviewing / addressed / all), date range
- Table:
  - Date | Practice | Protocol | Fitzpatrick | Indication | Status | Actions
  - Status as colored chip (new = error-700, reviewing = ink-500, addressed = ink-300)
  - Click row → `/admin/adverse-events/[id]`
  - Default sort: status='new' first, then most recent
- Empty state: "No adverse events reported."

## Route: `/admin/adverse-events/[id]`

**Purpose:** Review and manage a single adverse event.

**Layout:**

Header:
- Breadcrumb: `Adverse Events › {practice name} · {date}`
- H1: practice name + treatment date
- Status chip + reported timestamp
- Action buttons: status workflow (move to "Reviewing" / "Addressed")

Body sections:

**Section A — Adverse event description**
The full free-text description as logged by practitioner.

**Section B — Treatment context**
- Protocol used + version
- Indication
- Patient context (Fitzpatrick, age range, sex)
- Parameters delivered
- Treatment site
- Entered by

**Section C — Photos**
If treatment had photos attached, render thumbnails. Click to view full-size.

**Section D — Admin notes**
Internal-only textarea for Roni's review notes. Saves on blur.

**Section E — Audit log**
Filtered to actions on this adverse event record (status changes, note edits).

## API Routes (admin side)

`app/api/admin/adverse-events/route.ts` — GET list with filters
`app/api/admin/adverse-events/[id]/route.ts` — GET detail, PATCH (status + notes)

Standard `requireAdmin()` + `logAudit()` pattern.

---

# PORTAL TREATMENTS LIST (basic for P6)

## Route: `/portal/treatments`

Lightweight list for P6. P7 builds the full filterable history view.

**Layout:**
- Page header: eyebrow `§ TREATMENTS`, h1 `Treatments.`, lead `Recent treatments logged by your practice.`
- Top-right: "+ New treatment" primary button
- List: cards showing date, protocol, indication, Fitzpatrick, entered-by name
- Click card → `/portal/treatments/[id]` (read-only single-treatment view)
- Empty state: "No treatments logged yet. Log your first to begin contributing to the system."
- Pagination: 50 per page

P7 expands this with filters, search, follow-up workflow.

## Route: `/portal/treatments/[id]`

Read-only view of a single submitted treatment. Shows all data captured. Used after successful submission as confirmation, and for practitioners reviewing their own work.

No edit capability in P6 (P7 may add follow-up updates).

---

# PORTAL NAV UPDATE

Add "Treatments" to `PortalNav` from P5, between "Protocols" and the (future) "Notifications" placeholder.

```
PortalNav nav items (after P6):
- Protocols → /portal/protocols
- Treatments → /portal/treatments
```

---

# VERIFICATION

1. `npm run build` clean
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Migration written, NOT applied
5. Storage bucket SQL written, NOT applied
6. Manual test sequence (after migration applied):
   - Sign in as practice user
   - Visit `/portal/treatments/new` → form renders
   - Fill all required fields → submit → land on `/portal/treatments/[id]`
   - Confirm Supabase: treatment row created, audit log entry written
   - Add photos → submit → confirm Supabase Storage upload, treatment_photos rows
   - Verify EXIF data stripped (use `exifr` to read uploaded file from Storage, confirm no GPS/datetime)
   - Submit with adverse_reaction = yes → confirm:
     - treatment_adverse_events row inserted
     - Email arrives at admin
     - Admin panel shows badge count = 1 on Adverse Events nav item
     - `/admin/adverse-events` lists the event
     - Click event → detail view renders all context
   - Add new authorized user from "Entered by" dropdown → confirm `practice_authorized_users` row
   - Try submitting without consent when photos attached → form blocks with error
   - Try submitting with adverse_reaction = yes but no description → form blocks
7. RLS verification:
   - Sign in as a different practice
   - Visit `/portal/treatments` → see only own practice's treatments
   - Try direct URL to other practice's treatment ID → 404
   - Try direct URL to other practice's photo in Storage → 403
8. Mobile/iPad test at 375px and 768px:
   - Form usable, no horizontal scroll
   - Photo uploader touch-friendly
   - Submit button reachable without excessive scrolling
9. Form completion time test: log a treatment with all required fields → confirm 60-90 second target achievable

---

# PRE-DELIVERY CHECKLIST

- [ ] Tokens-only, no new colors/fonts/icons
- [ ] All migrations held for manual review
- [ ] Storage bucket SQL held for manual review
- [ ] EXIF stripping verified working client-side before upload
- [ ] Patient consent required when photos attached, blocks submission without it
- [ ] Adverse event triggers email + admin panel flag
- [ ] Protocol version locked at log time (not live reference)
- [ ] Form validation works client + server side
- [ ] Photo upload errors don't lose other form data
- [ ] All RLS policies tested (practice writes own only, admin reads all)
- [ ] All admin writes hit `logAudit()`
- [ ] Mobile/iPad form usable, no horizontal scroll
- [ ] Reduced motion respected
- [ ] Keyboard navigation through form works
- [ ] Empty states for all list views
- [ ] All copy [DRAFT]-marked

---

# DELIVERABLES

When done, report:
1. Production preview URLs (`/portal/treatments/new`, `/admin/adverse-events`)
2. Lighthouse scores
3. Migration SQL location (held)
4. Storage bucket SQL (held)
5. Components built
6. Drafted copy flagged for approval
7. EXIF stripping verification results
8. Form completion time test results (target: 60-90 seconds)
9. RLS verification confirmation (cross-practice + storage)
10. Adverse event flow verification (email + admin panel)
11. Decisions made not explicit in spec
12. Anything to verify before P7

After P6 is approved + migration applied + storage bucket configured + adverse event flow verified, P7 picks up: full treatment history view + admin aggregated dashboard.
