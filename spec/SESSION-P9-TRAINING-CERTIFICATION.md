# Session P9 — Training Library + Certification Tracking

> Run after P8 (Inbox) is deployed and confirmed working. Builds the practitioner training library, certification tracking per device, and the gate that prevents treatment logging until certification is complete for at least one owned device.

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/PORTAL-MASTER-SPEC.md`
6. `spec/RLS-PATTERNS.md`
7. `spec/SESSION-P4-PROTOCOL-LIBRARY-SCHEMA.md` (device gating pattern reference)
8. `spec/SESSION-P6-TREATMENT-LOGGING.md` (the surface being gated)
9. This spec

---

## The Architecture

**Training is now a hard gate.** Practitioners cannot log treatments for a device until at least one user at the practice has completed certification for that device. This makes training a real product feature, not a nice-to-have.

**Certification model is per-device.** Today: Precise Pico™. Tomorrow: Precise RF, Precise IPL. A practice that owns Pico + RF eventually has two separate certifications to maintain. Each device has its own training curriculum and certification.

**Self-hosted videos.** Supabase Storage. Full control over the player UX, no third-party branding, no analytics leaks to YouTube/Vimeo. More setup, more long-term flexibility.

---

## Goal

After this session:
- Roni can author training modules in admin (title, description, video, supporting materials)
- Modules group into curricula tied to devices
- Practitioners see a `/portal/training` library with their device's curriculum
- Practitioners watch videos (tracked progress), download supporting materials
- Module completion = watched 90%+ of video + acknowledged completion checkbox
- Curriculum completion = all modules complete = certification earned for that device
- Certification gates `/portal/treatments/new` for that device's protocols
- Admin can view certification status per practice (who's certified, who's pending, who hasn't started)
- Certificate PDF generated on completion for download/print
- Re-certification supported (admin can require re-cert for protocol-major-changes — flag, not full implementation in P9)

---

## What Gets Built

### Database
- `training_modules` table — individual lessons (video + materials + completion criteria)
- `training_curricula` table — collections of modules tied to a device
- `curriculum_modules` — many-to-many ordering of modules within a curriculum
- `module_progress` — per-user progress on each module (watch %, completed, completed_at)
- `practice_certifications` — per-practice, per-device certification status
- Storage buckets: `training-videos`, `training-materials`

### Admin UI
- `/admin/training` — curricula list + module management
- `/admin/training/curricula/[id]` — curriculum detail (manage modules, ordering)
- `/admin/training/modules/[id]` — module detail (video upload, materials, settings)
- `/admin/training/modules/new` — create new module
- `/admin/practices/[id]` — extend P2 detail view with certification status panel

### Portal UI
- `/portal/training` — curriculum overview for owned devices
- `/portal/training/[curriculumId]` — module list for a curriculum
- `/portal/training/modules/[moduleId]` — module player (video + materials + completion)
- `/portal/certificates/[deviceId]` — certificate PDF render

### Treatment logging gate
- `/portal/treatments/new` checks certification status before allowing protocol selection
- If not certified for any owned device → blocked state with link to training
- If certified for some devices but not others → only protocols for certified devices selectable

### Components
- VideoPlayer (custom HTML5 player with progress tracking)
- ModuleCard (list item)
- CurriculumProgressBar
- CertificationStatusBadge
- CertificateDocument (PDF render via React PDF or HTML→PDF)

---

## Critical Constraints

1. **Build on P1-P8 foundation.** Use existing patterns. RLS Class A for module_progress, Class B for training content.
2. **MASTER.md tokens only.** No new colors, fonts, icons.
3. **Hard gate on treatment logging.** No way around it via UI; no API workaround. Server-side validation in P6's treatment creation route.
4. **Per-device certification.** Practice with Pico but not RF can log Pico treatments only.
5. **Video tracking server-side.** Don't trust client-side progress events. Use periodic POST during playback.
6. **All migrations held for manual review.**
7. **Storage policies enforce practice-level access control.** Videos viewable by any active practice (training is shared). Materials too.
8. **Certificate PDF generation server-side.** Don't expose certificate data structure to client; render on server, return PDF.
9. **Mobile-friendly video player.** Practitioners may train on phones during downtime.
10. **Lighthouse 85+** on training pages (video-heavy).

---

# DATA MODEL

## Migration: `0011_training.sql`

```sql
-- Training modules (individual lessons)
create table public.training_modules (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  title text not null,
  slug text not null unique,
  description text,
  
  -- Video
  video_storage_path text, -- bucket path in training-videos
  video_duration_seconds integer,
  video_thumbnail_path text, -- bucket path in training-videos
  
  -- Completion criteria
  required_watch_percentage integer not null default 90 check (required_watch_percentage between 50 and 100),
  
  -- Status
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  
  -- Authoring
  created_by uuid references auth.users(id),
  last_updated_by uuid references auth.users(id)
);

create index idx_training_modules_status on public.training_modules(status);
create index idx_training_modules_slug on public.training_modules(slug);

-- Training curricula (groups of modules tied to a device)
create table public.training_curricula (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  device_id uuid not null references public.devices(id) on delete cascade,
  title text not null,
  description text,
  
  -- Status
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  
  -- Authoring
  created_by uuid references auth.users(id),
  last_updated_by uuid references auth.users(id),
  
  unique(device_id) -- one curriculum per device
);

create index idx_training_curricula_device_id on public.training_curricula(device_id);
create index idx_training_curricula_status on public.training_curricula(status);

-- Curriculum-module ordering (many-to-many with order)
create table public.curriculum_modules (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.training_curricula(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  sort_order integer not null,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  
  unique(curriculum_id, module_id),
  unique(curriculum_id, sort_order)
);

create index idx_curriculum_modules_curriculum_id on public.curriculum_modules(curriculum_id);
create index idx_curriculum_modules_module_id on public.curriculum_modules(module_id);

-- Module supporting materials (PDFs, slides, etc.)
create table public.module_materials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  module_id uuid not null references public.training_modules(id) on delete cascade,
  
  title text not null,
  storage_path text not null, -- bucket path in training-materials
  filename text not null,
  mime_type text not null,
  byte_size integer not null,
  sort_order integer not null default 0
);

create index idx_module_materials_module_id on public.module_materials(module_id);

-- Per-user module progress
create table public.module_progress (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  practice_id uuid not null references public.practices(id) on delete cascade,
  practice_user_id uuid references public.practice_authorized_users(id) on delete set null,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  
  -- Watch tracking
  watch_percentage integer not null default 0 check (watch_percentage between 0 and 100),
  last_position_seconds integer not null default 0,
  watch_started_at timestamptz default now(),
  watch_completed_at timestamptz,
  
  -- Acknowledgment
  acknowledged boolean not null default false,
  acknowledged_at timestamptz,
  
  -- Completion
  is_complete boolean not null default false,
  completed_at timestamptz,
  
  unique(practice_id, practice_user_id, module_id)
);

create index idx_module_progress_practice_id on public.module_progress(practice_id);
create index idx_module_progress_module_id on public.module_progress(module_id);
create index idx_module_progress_complete on public.module_progress(is_complete) where is_complete = true;

-- Practice certifications (per-device)
create table public.practice_certifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  practice_id uuid not null references public.practices(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  curriculum_id uuid not null references public.training_curricula(id),
  
  -- Status
  status text not null default 'in_progress' check (status in (
    'in_progress', 'certified', 'expired', 'revoked'
  )),
  
  -- Completion details
  certified_at timestamptz,
  certified_by_user_id uuid references public.practice_authorized_users(id),
  
  -- Re-cert tracking (for major protocol changes)
  expires_at timestamptz,
  recert_required boolean not null default false,
  recert_reason text,
  
  unique(practice_id, device_id)
);

create index idx_practice_certifications_practice_id on public.practice_certifications(practice_id);
create index idx_practice_certifications_device_id on public.practice_certifications(device_id);
create index idx_practice_certifications_status on public.practice_certifications(status);

-- Updated_at triggers
create trigger trg_training_modules_updated_at
  before update on public.training_modules
  for each row execute function public.set_updated_at();

create trigger trg_training_curricula_updated_at
  before update on public.training_curricula
  for each row execute function public.set_updated_at();

create trigger trg_module_progress_updated_at
  before update on public.module_progress
  for each row execute function public.set_updated_at();

create trigger trg_practice_certifications_updated_at
  before update on public.practice_certifications
  for each row execute function public.set_updated_at();

-- RLS policies

-- training_modules: Class B — admin all, practice read published
alter table public.training_modules enable row level security;

create policy training_modules_admin_all on public.training_modules
  for all using (public.is_admin()) with check (public.is_admin());

create policy training_modules_practice_read_published on public.training_modules
  for select using (
    public.is_practice() and status = 'published'
  );

-- training_curricula: same Class B, with device-gating for practices
alter table public.training_curricula enable row level security;

create policy training_curricula_admin_all on public.training_curricula
  for all using (public.is_admin()) with check (public.is_admin());

create policy training_curricula_practice_read_owned_devices on public.training_curricula
  for select using (
    public.is_practice() 
    and status = 'published'
    and exists (
      select 1 from public.practice_devices pd
      where pd.practice_id = public.current_practice_id()
        and pd.device_id = training_curricula.device_id
    )
  );

-- curriculum_modules: same Class B
alter table public.curriculum_modules enable row level security;

create policy curriculum_modules_admin_all on public.curriculum_modules
  for all using (public.is_admin()) with check (public.is_admin());

create policy curriculum_modules_practice_read on public.curriculum_modules
  for select using (
    public.is_practice()
    and exists (
      select 1 from public.training_curricula tc
      where tc.id = curriculum_modules.curriculum_id
        and tc.status = 'published'
        and exists (
          select 1 from public.practice_devices pd
          where pd.practice_id = public.current_practice_id()
            and pd.device_id = tc.device_id
        )
    )
  );

-- module_materials: Class B (read-only for practices)
alter table public.module_materials enable row level security;

create policy module_materials_admin_all on public.module_materials
  for all using (public.is_admin()) with check (public.is_admin());

create policy module_materials_practice_read on public.module_materials
  for select using (
    public.is_practice()
    and exists (
      select 1 from public.training_modules tm
      where tm.id = module_materials.module_id
        and tm.status = 'published'
    )
  );

-- module_progress: Class A (practice CRUDs own progress)
alter table public.module_progress enable row level security;

create policy module_progress_admin_all on public.module_progress
  for all using (public.is_admin()) with check (public.is_admin());

create policy module_progress_practice_crud_own on public.module_progress
  for all using (
    public.is_practice() and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice() and practice_id = public.current_practice_id()
  );

-- practice_certifications: Class A read for practice, admin can update status
alter table public.practice_certifications enable row level security;

create policy practice_certifications_admin_all on public.practice_certifications
  for all using (public.is_admin()) with check (public.is_admin());

create policy practice_certifications_practice_read_own on public.practice_certifications
  for select using (
    public.is_practice() and practice_id = public.current_practice_id()
  );

-- Practices can INSERT their own certifications when completing training (server-side)
create policy practice_certifications_practice_insert_own on public.practice_certifications
  for insert with check (
    public.is_practice() and practice_id = public.current_practice_id()
  );

create policy practice_certifications_practice_update_own on public.practice_certifications
  for update using (
    public.is_practice() and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice() and practice_id = public.current_practice_id()
  );

-- RPC: check certification status for a practice + device
create or replace function public.is_practice_certified_for_device(
  p_practice_id uuid,
  p_device_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from practice_certifications
    where practice_id = p_practice_id
      and device_id = p_device_id
      and status = 'certified'
      and (expires_at is null or expires_at > now())
  );
end;
$$;
```

## Storage buckets

```sql
-- Run in Supabase SQL editor (separate from migration)

-- Training videos (large files)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'training-videos', 
  'training-videos', 
  false, 
  5368709120, -- 5GB per file (allows long-form video)
  array['video/mp4', 'video/webm', 'video/quicktime']
);

-- Training materials (PDFs, etc.)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'training-materials', 
  'training-materials', 
  false, 
  104857600, -- 100MB per file
  array['application/pdf', 'image/jpeg', 'image/png', 'application/zip']
);

-- Storage RLS — admin uploads, all practices read

-- Training videos
create policy "Admin uploads training videos"
on storage.objects for insert
with check (
  bucket_id = 'training-videos' and public.is_admin()
);

create policy "Authenticated users read training videos"
on storage.objects for select
using (
  bucket_id = 'training-videos' 
  and (public.is_admin() or public.is_practice())
);

create policy "Admin manages training videos"
on storage.objects for update
using (
  bucket_id = 'training-videos' and public.is_admin()
);

create policy "Admin deletes training videos"
on storage.objects for delete
using (
  bucket_id = 'training-videos' and public.is_admin()
);

-- Same pattern for training-materials
create policy "Admin uploads training materials"
on storage.objects for insert
with check (
  bucket_id = 'training-materials' and public.is_admin()
);

create policy "Authenticated users read training materials"
on storage.objects for select
using (
  bucket_id = 'training-materials' 
  and (public.is_admin() or public.is_practice())
);

create policy "Admin manages training materials"
on storage.objects for update
using (
  bucket_id = 'training-materials' and public.is_admin()
);

create policy "Admin deletes training materials"
on storage.objects for delete
using (
  bucket_id = 'training-materials' and public.is_admin()
);
```

---

# ADMIN UI

## Route: `/admin/training`

**Purpose:** Manage curricula and modules.

**Layout:**

Page header:
- Eyebrow: `§ ADMIN`
- H1: `Training.`
- Lead: `Manage training curricula and modules. Each device has one curriculum; certifications gate treatment logging for that device.`

Action: `+ New module` button (top-right).

**Tabs / sections:**
- "Curricula" (default) — list of curricula by device
- "All modules" — list of all modules (filterable)

**Curricula list:**

```
Card per curriculum, showing:
- Device name + icon
- Curriculum title
- Status chip (draft/published/archived)
- Module count
- Total duration (sum of module video durations)
- Practice certification stats: X certified · Y in progress · Z not started
- Actions: View · Edit · Publish/Unpublish
```

Click curriculum → `/admin/training/curricula/[id]`

**Modules tab:**

Table:
- Title
- Status chip
- Curricula it belongs to (chip stack)
- Duration
- Last updated
- Actions: View · Edit

Click row → `/admin/training/modules/[id]`

## Route: `/admin/training/curricula/[id]`

**Layout:**

Page header:
- Breadcrumb: `Training › {device name} curriculum`
- Eyebrow: `§ {device name}`
- H1: curriculum title
- Status chip + meta
- Actions: Edit · Publish/Unpublish · Archive

Body sections:

**Section A — Identity (editable inline or modal)**
- Title
- Description
- Device (read-only after creation)

**Section B — Modules (orderable list)**
- Drag-handle ordering
- Each module shows: title, duration, required toggle, remove button
- "+ Add module" → modal listing existing modules to attach

**Section C — Certification stats**
- Practices with certified: count + list (links to practice detail)
- Practices in progress: count
- Practices not started: count
- Average completion time

**Section D — Audit log**
- Curriculum changes, module add/remove, status flips

## Route: `/admin/training/modules/[id]` and `/new`

**Form fields:**
- Title (required)
- Slug (auto-generated, editable)
- Description
- Video upload (drag-drop, shows progress bar, supports up to 5GB)
- Video thumbnail upload (auto-extracted from video at 25% mark, but admin can override)
- Required watch percentage (slider, 50-100%, default 90%)
- Supporting materials (multi-file upload — PDFs, images, ZIPs)
- Status (draft / published / archived)

**Video upload flow:**
1. Admin drops video file
2. Client-side: validate type + size
3. Multi-part upload to Supabase Storage with progress
4. After upload: server extracts duration via ffprobe-style call
5. Store storage_path + duration on training_modules row
6. Auto-generate thumbnail from 25% mark (server-side using ffmpeg or accept manual upload)

If ffmpeg server-side processing is too heavy for the build:
- Manual duration entry by admin (number input, in seconds)
- Manual thumbnail upload (image file)
- Document this as Q4 polish (auto-extraction)

## Practice detail extension (existing /admin/practices/[id])

Add new section to the existing practice detail view:

**Section: Certifications**
- For each owned device: certification status chip + certified date + certified-by user
- Click certification → modal showing module-by-module progress
- Action: "Require re-certification" button (with confirmation, sets recert_required = true)

---

# PORTAL UI

## Route: `/portal/training`

**Purpose:** Practitioner's training home. Shows curricula for their owned devices.

**Layout:**

Page header:
- Eyebrow: `§ TRAINING`
- H1: `Training.`
- Lead: `Complete training to unlock treatment logging for your devices.`

**Curriculum cards (one per owned device):**

```
[Device icon] Precise Pico™

Pico Training Curriculum
Master the protocols, parameter envelopes, and biologic control 
for the Precise Pico system.

Progress: ████████░░ 80% (8 of 10 modules)
Status: In progress

[Continue training →]

Or, if certified:
Status: Certified · 2026-04-15 by Dr. Smith
[View certificate ↓]
```

If practice has multiple devices, multiple cards.

If practice has no devices: empty state pointing to /contact.

## Route: `/portal/training/[curriculumId]`

**Purpose:** Module list for a curriculum.

**Layout:**

Page header:
- Breadcrumb: `Training › {device} curriculum`
- H1: curriculum title
- Progress bar: X / Y modules complete
- Lead: description

**Module list:**

Each module shown as a row:
- Module number (01, 02, 03...)
- Title
- Duration
- Status: Not started / In progress (X% watched) / Complete ✓
- Action: "Start" / "Resume" / "Review"

Required modules marked with a small required indicator. Optional modules shown after.

If all required modules complete + acknowledged → "Complete certification" CTA at top → triggers certification creation.

## Route: `/portal/training/modules/[moduleId]`

**Purpose:** The actual training experience. Video + materials + completion.

**Layout:**

Page header:
- Breadcrumb: `Training › {curriculum} › {module}`
- H1: module title
- Description

Body:

**Section A — Video player (large, full-width on desktop)**
- Custom HTML5 video player
- Standard controls: play/pause, scrubber, volume, fullscreen
- Hide skip-forward beyond unwatched portion (no seeking past current progress on first watch)
- After watch_percentage >= required, scrubbing unlocks fully
- Progress saved every 10 seconds via API call to update `module_progress`
- Resume from `last_position_seconds` on next visit

**Section B — Module materials**
- List of attached PDFs/images
- Click to download (signed Supabase Storage URL, expires 1 hour)

**Section C — Completion**
- Once watch_percentage >= required:
  - Acknowledgment checkbox: "I have completed this module and understood the material."
  - "Mark module complete" button
- Until then: "Watch the full video to enable completion."

After completion:
- Toast: "Module complete."
- Auto-advance to next module link
- If last module in curriculum + acknowledged: prompt to complete certification

## Route: `/portal/certificates/[deviceId]`

**Purpose:** Display + download certificate.

Server-rendered certificate document, served as both HTML view and PDF download.

**Certificate content:**
- Precise Aesthetics letterhead
- "Certificate of Completion"
- Device name (Precise Pico™)
- Practice name
- Certified user name (whoever acknowledged the final module)
- Certification date
- Certification ID (UUID)
- Roni Bolton clinical signature (rendered from image asset)
- "Valid until" date if expires_at set

PDF download via React PDF or HTML→PDF library (puppeteer-style or `@react-pdf/renderer`).

## Treatment logging gate

Modify `/portal/treatments/new` from P6:

**Pre-check (server-side, before form renders):**
1. Get practice's owned devices
2. For each device, check `is_practice_certified_for_device()` RPC
3. If certified for at least one device: proceed to normal form (filter protocol selector to only certified-device protocols)
4. If certified for zero devices: render blocked state

**Blocked state:**

```
[Big icon: Lock or AcademicCap]

Complete training before logging treatments.

Treatment logging is unlocked once your practice has completed 
certification for at least one of your devices.

[Continue training →] /portal/training
```

**Filtered protocol selector:**

When certified for some devices but not others:
- Protocol dropdown only shows protocols whose `applicable_devices` include certified devices
- Subtle note: "Showing protocols for certified devices. Complete training for [other device] to access more protocols."

**Server-side enforcement in API:**

In `POST /api/portal/treatments` (from P6), add a check:
- Look up the protocol's applicable_devices
- Confirm practice is certified for at least one of those devices
- If not, return 403 with error code

This prevents API workarounds.

---

# COMPONENTS

```
components/admin/training/
├── CurriculumCard.tsx
├── CurriculaList.tsx
├── ModulesTable.tsx
├── ModuleEditForm.tsx
├── ModuleVideoUploader.tsx       (large file uploads with progress)
├── MaterialsManager.tsx
├── ModuleOrderingList.tsx        (drag-drop ordering within curriculum)
├── CertificationStatsPanel.tsx   (on curriculum detail)
└── PracticeCertificationsPanel.tsx (extends practice detail view)

components/portal/training/
├── CurriculumOverviewCard.tsx
├── ModulesProgressList.tsx
├── ModuleRow.tsx
├── VideoPlayer.tsx               (custom HTML5 player with progress tracking)
├── ModuleMaterials.tsx
├── ModuleCompletionPanel.tsx     (acknowledgment + complete button)
├── CompletionToast.tsx
└── CertificationGateBlock.tsx    (used in /portal/treatments/new)

components/portal/certificates/
├── CertificateDocument.tsx       (rendered HTML for both view and PDF)
└── CertificateDownloadButton.tsx
```

---

# API ROUTES

## Admin routes

- `GET /api/admin/training/curricula` — list
- `POST /api/admin/training/curricula` — create
- `GET/PATCH/DELETE /api/admin/training/curricula/[id]` — manage
- `POST /api/admin/training/curricula/[id]/modules` — add module to curriculum
- `DELETE /api/admin/training/curricula/[id]/modules/[moduleId]` — remove
- `PATCH /api/admin/training/curricula/[id]/modules/[moduleId]/order` — reorder

- `GET /api/admin/training/modules` — list
- `POST /api/admin/training/modules` — create
- `GET/PATCH/DELETE /api/admin/training/modules/[id]` — manage
- `POST /api/admin/training/modules/[id]/video` — initiate upload
- `POST /api/admin/training/modules/[id]/materials` — add material
- `DELETE /api/admin/training/modules/[id]/materials/[materialId]` — remove

- `POST /api/admin/practices/[id]/certifications/[deviceId]/recert` — flag re-cert required

## Portal routes

- `GET /api/portal/training/curricula` — practice's curricula
- `GET /api/portal/training/curricula/[id]` — single curriculum + modules
- `GET /api/portal/training/modules/[id]` — module + materials + own progress
- `POST /api/portal/training/modules/[id]/progress` — update watch progress (rate-limited; called every 10s during playback)
- `POST /api/portal/training/modules/[id]/acknowledge` — mark acknowledged + complete
- `POST /api/portal/training/curricula/[id]/certify` — finalize certification (requires all required modules complete)
- `GET /api/portal/certificates/[deviceId]/pdf` — generate + return PDF

---

# VIDEO PLAYER IMPLEMENTATION

The custom video player is the trickiest UI component.

**File:** `components/portal/training/VideoPlayer.tsx`

**Features:**
- Standard HTML5 `<video>` element with custom controls overlay
- Play/pause, scrubber, volume, fullscreen, playback speed
- Lock seeking past unwatched portion on first watch
- Track watch percentage as max-seen position / duration
- Save progress every 10 seconds via API (debounced)
- Save progress on pause, on visibility change (tab switch), on unload
- Resume from `last_position_seconds` on mount
- Mobile-friendly: tap-to-play, native fullscreen on iOS

**Progress save throttling:**
- Don't save more than once per 10 seconds
- Don't save if watch percentage hasn't increased
- Use `navigator.sendBeacon()` on unload for reliability

**Completion detection:**
- Watch percentage hits required threshold
- Emit "watch-complete" event
- Parent component shows acknowledgment checkbox

---

# CERTIFICATE PDF GENERATION

**Library options:**
1. `@react-pdf/renderer` — React component → PDF, more flexible, requires React PDF primitives
2. Puppeteer/Playwright server-side HTML→PDF — render existing HTML page, convert to PDF
3. Server-rendered HTML + browser print-to-PDF user action — simplest

**Recommendation:** Option 3 for v1.

- `/portal/certificates/[deviceId]` renders a print-styled HTML page
- Page has a download button that triggers `window.print()` with print stylesheet → user saves as PDF
- No server-side PDF library needed
- Faster build, no infra

If true PDF download is required (vs print-to-PDF), use `@react-pdf/renderer` and add `pdf` route handler.

P9 ships with Option 3. Future polish session can add native PDF if needed.

**Certificate visual design:**
- Letterhead with Precise Aesthetics logo (Fraunces wordmark)
- Centered title: "Certificate of Completion"
- Sub-line: device name in Fraunces italic
- Body: "This certifies that [Practice Name] has completed the [Curriculum Title] training program."
- Practitioner name + role
- Date certified
- Roni Bolton signature (image asset, signed name + title "Clinical Director")
- Certificate ID (UUID footer)
- Subtle border, brand-300 hairlines, bone-100 background

---

# PORTAL NAV UPDATE

`PortalNav` from P5/P6 — extend with Training link:

```
1. Protocols → /portal/protocols
2. Treatments → /portal/treatments
3. Training → /portal/training       (NEW)
```

---

# VERIFICATION

Before declaring done:

1. `npm run build` clean
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Migration written, NOT applied
5. Storage bucket SQL written, NOT applied
6. Manual test sequence (after migration applied + buckets configured):
   - Sign in as admin
   - Visit `/admin/training` → empty state shows
   - Create new curriculum for Precise Pico
   - Create 3 modules with video uploads (use small test videos for upload)
   - Order modules in curriculum
   - Publish curriculum + modules
   - Sign in as practice user
   - Visit `/portal/training` → see Pico curriculum
   - Click curriculum → see 3 modules
   - Click module → video plays, progress tracked
   - Watch to 90%+ → acknowledgment unlocks
   - Acknowledge + mark complete → next module link appears
   - Complete all modules → certification button appears
   - Click certify → certification record created
   - Visit `/portal/treatments/new` → blocked state OR allowed (depending on prior state)
   - With certification: protocol selector shows only Pico protocols
   - Without certification: blocked state with "Complete training" link
   - Try direct API POST to /api/portal/treatments without certification → 403
7. Certificate test:
   - Visit `/portal/certificates/[deviceId]` → certificate renders
   - Print preview shows clean certificate without UI chrome
8. RLS verification:
   - Practice without Pico ownership → can't see Pico curriculum (curriculum query returns empty)
   - Practice can read own progress only — cross-practice progress queries blocked
9. Mobile test (iPad + phone):
   - Video player works, controls accessible
   - Module list readable
   - Certificate page readable
10. Reduced motion respected (no auto-play animations, etc.)

---

# PRE-DELIVERY CHECKLIST

- [ ] Tokens-only, no new colors/fonts/icons
- [ ] All migrations held for manual review
- [ ] Storage bucket SQL held for manual review
- [ ] Hard gate on treatment logging — server-side check confirmed
- [ ] Per-device certification, not global
- [ ] Video progress saves server-side at 10s intervals
- [ ] Certificate downloadable (print-to-PDF flow works)
- [ ] All RLS policies tested
- [ ] All admin writes hit `logAudit()`
- [ ] Mobile video player functional
- [ ] Reduced motion respected
- [ ] All copy [DRAFT]-marked

---

# DELIVERABLES

When done, report:
1. Production preview URLs (`/admin/training`, `/portal/training`)
2. Lighthouse scores
3. Migration SQL location (held)
4. Storage bucket SQL (held)
5. Components built
6. Drafted copy flagged for approval
7. Video upload + playback test results (use a small test video)
8. RLS verification confirmation (per-device gating works)
9. Treatment logging gate verification (blocked when uncertified)
10. Certificate render + print test results
11. Decisions made not explicit in spec
12. Anything to verify before P10

After P9 is approved + migrations applied + storage buckets configured + manual training flow tested, P10 picks up: notifications (in-app + email).
