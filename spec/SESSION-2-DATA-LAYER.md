# Session 2 — Sanity Schemas + Supabase Tables

> Run from repo root after Session 1 is complete and the updated `CLAUDE.md`, `BRAND-IDENTITY.md`, `MASTER.md`, and `COPY-DECK.md` are committed.

## Context

You have already read `CLAUDE.md`, `design-system/MASTER.md`, `design-system/BRAND-IDENTITY.md`, and `design-system/COPY-DECK.md`. All decisions in those files are binding. This session is **content modeling only** — no UI yet.

## Goal

Stand up the data layer:
- Sanity v3 schemas for all CMS-managed content
- Supabase tables, RLS policies, and indexes for all relational data
- TypeScript types and query helpers
- The Sanity Studio at `/studio` becomes usable for content authoring

No pages, no components, no styling work this session.

## Critical Constraints

- **Protocols are GATED.** Never rendered publicly. Only accessed inside the practitioner portal behind Supabase Auth.
- **No `teamMember` schema.** No public personalities. Roni authors content directly in Sanity Studio without being attributed publicly.
- **No PHI in Sanity.** Patient-related data (treatment logs, outcomes) lives in Supabase only, de-identified.
- **System-first framing** in any descriptive text inside schemas (descriptions shown to authors in Studio).

---

## Part 1 — Sanity Schemas

Create these in `/sanity/schemas/`:

### 1. `indication.ts` — Referenceable taxonomy

Used internally to categorize protocols and case studies. Public marketing pages may show indication names but not protocol details.

Fields:
- `title` (string, required) — e.g., "Melasma"
- `slug` (slug from title, required)
- `shortDescription` (text, ~140 chars) — for internal use and possibly marketing copy
- `icon` (string, optional — Lucide icon name)
- `displayOrder` (number) — for sorting
- `isPublic` (boolean, default true) — whether this indication name appears in public marketing

### 2. `protocol.ts` — The crown jewel (GATED)

Treated as proprietary IP. Never rendered on public pages. Only fetched inside `/portal/*` routes after auth check.

Fields:
- `title` (string, required) — e.g., "Melasma — Fitzpatrick IV–VI"
- `slug` (slug, required)
- `indication` (reference to indication, required)
- `fitzpatrickRange` (object: `min` 1-6, `max` 1-6, both required)
- `difficulty` (string, options: 'foundational' | 'intermediate' | 'advanced')
- `estimatedSessions` (object: `min`, `max` numbers)
- `sessionInterval` (string) — e.g., "4–6 weeks"
- `summary` (text, 2-3 sentences, plain text)
- `clinicalRationale` (Portable Text)
- `parameters` (array of objects):
  - `parameterName` (string) — e.g., "Wavelength", "Fluence"
  - `value` (string)
  - `notes` (string, optional)
- `technique` (Portable Text)
- `preTreatment` (Portable Text)
- `postTreatment` (Portable Text)
- `kitRecommendation` (string, optional)
- `contraindications` (array of strings)
- `expectedOutcomes` (Portable Text)
- `complications` (Portable Text)
- `relatedProtocols` (array of references to protocol)
- `clinicalReferences` (array of objects: `citation` text, `url` url optional)
- `lastReviewed` (date)
- `status` (string: 'draft' | 'published' | 'archived')

Note: no `reviewedBy` field — we are not tracking authorship publicly.

### 3. `caseStudy.ts` (GATED — portal only)

Fields:
- `title` (string)
- `slug` (slug)
- `indication` (reference to indication)
- `protocol` (reference to protocol, optional)
- `patientProfile` (object): `ageRange` string, `fitzpatrick` 1-6, `presentingConcern` string
- `sessionCount` (number)
- `beforeImage` (image with required alt, mark as sensitive)
- `afterImage` (image with required alt, mark as sensitive)
- `clinicalNarrative` (Portable Text)
- `consentObtained` (boolean, REQUIRED to be true to publish — enforce via validation)
- `publishedAt` (datetime)
- `status` (string: 'draft' | 'published' | 'archived')

### 4. `event.ts` — Public

For the Aug 8 launch and any future events.

Fields:
- `title` (string)
- `slug` (slug)
- `eventType` (string: 'launch' | 'webinar' | 'conference' | 'training')
- `startsAt` (datetime, required)
- `endsAt` (datetime)
- `location` (object): `venueName`, `address`, `city`, `state`, `virtualLink`
- `isHybrid` (boolean)
- `heroImage` (image with alt)
- `description` (Portable Text)
- `agenda` (array of objects: `time` string, `title` string, `description` text)
- `capacity` (number, optional)
- `rsvpEnabled` (boolean)
- `status` (string: 'upcoming' | 'live' | 'past')

No `speakers` field. No personalities.

### 5. `pressItem.ts` — Public

Fields:
- `title` (string)
- `publication` (string)
- `publicationLogo` (image)
- `url` (url)
- `publishedAt` (date)
- `excerpt` (text)
- `displayOnPressPage` (boolean)

### 6. `siteSettings.ts` — Singleton, public config

Fields:
- `companyName` (string, default "Precise Aesthetics")
- `tagline` (string, default "Predictable outcomes across every skin type.")
- `defaultMetaDescription` (text)
- `contactEmail` (string)
- `contactPhone` (string)
- `pressEmail` (string)
- `socialLinks` (array of objects: `platform`, `url`)
- `footerNote` (Portable Text)
- `launchEventReference` (reference to event)

Configure as a singleton in Studio (one document only, not creatable as new).

---

## Part 2 — Sanity Studio Configuration

In `/sanity/sanity.config.ts`:
- Register all 6 schemas
- Configure desk structure with grouping:
  1. **Site Settings** (singleton at top)
  2. **Events** (the launch lives here)
  3. **Indications** (taxonomy)
  4. **Protocols** (gated content — add a visual indicator in Studio that these are private)
  5. **Case Studies** (gated)
  6. **Press**
- Add a Studio README/info pane that reminds authors: "Protocols and Case Studies are PRIVATE. They render only inside the practitioner portal."

---

## Part 3 — Sanity Queries + Types

In `/lib/sanity/queries.ts`, write GROQ queries:

**Public queries (used by marketing site):**
- `getSiteSettings`
- `getAllPublicIndications` (filtered to `isPublic == true`)
- `getEventBySlug`
- `getUpcomingEvents`
- `getPressItems`

**Portal queries (used only inside authenticated routes):**
- `getAllPublishedProtocols`
- `getProtocolBySlug`
- `getProtocolsByIndication`
- `getCaseStudiesByIndication`
- `getCaseStudyBySlug`

Add `next.tags` to each query for ISR revalidation. Tag pattern: `protocol:${slug}`, `event:${slug}`, etc.

In `/lib/sanity/types.ts`, generate TypeScript types matching every schema. Use Sanity's TypeGen if available, or hand-write types if simpler.

In `/lib/sanity/image.ts`, ensure the `urlFor` helper handles all image sources from these schemas.

---

## Part 4 — Supabase Tables

Run these as a Supabase SQL migration. Save the SQL in `/supabase/migrations/0001_initial_schema.sql`.

```sql
-- ============================================================
-- LEAD CAPTURE (teaser, footer email signup)
-- ============================================================
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text,
  last_name text,
  practice_name text,
  role text,
  source text,                    -- 'teaser' | 'launch_page' | 'protocol_page' | 'footer'
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz default now()
);
create unique index leads_email_idx on public.leads(lower(email));
create index leads_created_idx on public.leads(created_at desc);

-- ============================================================
-- DEMO REQUESTS (the primary conversion event)
-- ============================================================
create table public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  practice_name text not null,
  role text not null,             -- 'physician' | 'aprn' | 'pa' | 'rn' | 'owner' | 'other'
  practice_type text,             -- 'derm' | 'medspa' | 'plastics' | 'multi' | 'other'
  state text,
  current_devices text[],
  monthly_treatment_volume text,  -- bucket: '0-50' | '50-200' | '200-500' | '500+'
  primary_interest text[],        -- 'tattoo' | 'melasma' | 'pih' | etc
  timeline text,                  -- 'now' | '30d' | '60-90d' | 'exploring'
  cal_booking_id text,
  status text default 'new',      -- 'new' | 'contacted' | 'demo_scheduled' | 'demo_completed' | 'closed_won' | 'closed_lost'
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index demo_requests_status_idx on public.demo_requests(status);
create index demo_requests_created_idx on public.demo_requests(created_at desc);

-- ============================================================
-- LAUNCH EVENT RSVPs
-- ============================================================
create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null,       -- e.g., 'launch-2026-08-08'
  first_name text not null,
  last_name text not null,
  email text not null,
  practice_name text,
  role text,
  attending_in_person boolean default false,
  attending_virtual boolean default true,
  dietary_restrictions text,
  guest_count int default 0,
  created_at timestamptz default now()
);
create unique index event_rsvps_email_event_idx on public.event_rsvps(lower(email), event_slug);

-- ============================================================
-- PRACTITIONERS (portal users — auth-linked)
-- Account provisioning is manual. No public registration.
-- ============================================================
create table public.practitioners (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  practice_name text,
  role text,
  device_serial text,             -- linked when device sells
  device_purchased_at date,
  onboarded_at timestamptz,
  is_admin boolean default false, -- internal admin flag
  created_at timestamptz default now()
);
create index practitioners_device_serial_idx on public.practitioners(device_serial);
create index practitioners_is_admin_idx on public.practitioners(is_admin) where is_admin = true;

-- ============================================================
-- TREATMENT LOGS (Data Intelligence Layer — Level 2)
-- De-identified outcome data. NO PHI.
-- ============================================================
create table public.treatment_logs (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid references public.practitioners(id) on delete cascade,
  -- De-identified patient profile (no name, no DOB, no contact)
  patient_local_ref text,         -- practitioner's own ref (e.g., "PT-0142") — never PHI
  patient_age_range text,         -- '18-24' | '25-34' | etc — bucketed for privacy
  patient_fitzpatrick int check (patient_fitzpatrick between 1 and 6),
  patient_sex text,               -- 'F' | 'M' | 'NB' | 'PNTS'
  -- Treatment context
  indication_slug text not null,  -- matches Sanity indication.slug
  protocol_slug text,             -- matches Sanity protocol.slug
  session_number int,
  total_sessions_planned int,
  -- Parameters used
  wavelength_nm int,              -- 532 | 1064 | 755 | 785
  fluence_j_cm2 numeric,
  spot_size_mm numeric,
  pulse_count int,
  -- Outcome
  endpoint_observed text,         -- 'expected' | 'partial' | 'incomplete' | 'over'
  immediate_response text,
  complications text[],
  practitioner_satisfaction int check (practitioner_satisfaction between 1 and 5),
  notes text,
  -- Consent + provenance
  patient_consent_marketing boolean default false,
  treatment_date date not null,
  created_at timestamptz default now()
);
create index treatment_logs_practitioner_idx on public.treatment_logs(practitioner_id);
create index treatment_logs_indication_idx on public.treatment_logs(indication_slug);
create index treatment_logs_fitzpatrick_idx on public.treatment_logs(patient_fitzpatrick);
create index treatment_logs_treatment_date_idx on public.treatment_logs(treatment_date desc);

-- ============================================================
-- OUTCOME METRICS (aggregate view for admin dashboard)
-- Materialized view refreshed nightly OR computed on demand.
-- For now, leave as a placeholder — implement as a view in Session 11 (portal build).
-- ============================================================
-- (intentionally blank — defined later)

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================
alter table public.leads enable row level security;
alter table public.demo_requests enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.practitioners enable row level security;
alter table public.treatment_logs enable row level security;

-- Policies:
-- Public form submissions go through service-role API routes — no user-facing INSERT policies needed
-- (service role bypasses RLS).

-- Practitioners can read and update their own profile
create policy "practitioners read own"
  on public.practitioners for select
  using (auth.uid() = id);

create policy "practitioners update own"
  on public.practitioners for update
  using (auth.uid() = id);

-- Practitioners can read and write their own treatment logs
create policy "treatment logs read own"
  on public.treatment_logs for select
  using (auth.uid() = practitioner_id);

create policy "treatment logs insert own"
  on public.treatment_logs for insert
  with check (auth.uid() = practitioner_id);

create policy "treatment logs update own"
  on public.treatment_logs for update
  using (auth.uid() = practitioner_id);

-- Admins (is_admin = true) can read all treatment logs and practitioners
-- (used by the internal admin dashboard for the Data Intelligence Layer)
create policy "admins read all practitioners"
  on public.practitioners for select
  using (
    exists (
      select 1 from public.practitioners p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "admins read all treatment logs"
  on public.treatment_logs for select
  using (
    exists (
      select 1 from public.practitioners p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger demo_requests_updated_at
  before update on public.demo_requests
  for each row execute function public.set_updated_at();
```

---

## Part 5 — Supabase Type Generation

After running the migration on the Supabase project:

1. Use Supabase CLI to generate TypeScript types: `npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts`
2. Or hand-write types in `/lib/supabase/types.ts` matching the schema

Wire the generated types into both `lib/supabase/server.ts` and `lib/supabase/client.ts` so all queries are type-safe.

---

## Part 6 — Verification

Before declaring this session done:

1. `npm run build` passes clean
2. `npx tsc --noEmit` passes clean
3. `npm run lint` passes clean
4. Visit `/studio` — Sanity Studio loads with all 6 schemas registered
5. Create one test document of each public schema (`siteSettings`, `event`, `pressItem`, `indication`) to confirm the Studio editor works
6. Confirm Supabase migration ran successfully — all 5 tables exist, RLS enabled, policies active
7. Run a simple test query in the Supabase SQL editor: `select count(*) from leads;` — returns 0 rows, no error

---

## Do NOT in This Session

- Do not build any pages or components
- Do not implement API route bodies (stubs from Session 1 stay stubs)
- Do not write email templates
- Do not seed any production data (test docs only, then delete)
- Do not build the practitioner portal UI (Session 11)
- Do not create the admin dashboard (Session 11)

---

## Deliverables

When done, report back:
1. Confirmation all 6 Sanity schemas are registered and Studio loads
2. Confirmation the Supabase migration ran cleanly with all RLS policies active
3. The TypeScript type generation status (any blockers)
4. Any decisions you made that weren't explicit in this prompt
5. Any blockers or missing env vars

Then we move to Session 3: design system base components (Header, Footer, Button, Section).
