-- ============================================================
-- Precise Aesthetics — Treatment Logging (Session P6)
-- ============================================================
-- The data-input surface that feeds the Data Intelligence Layer.
-- Practitioners log a completed treatment in 60-90 seconds; the
-- captured fields drive pattern detection and protocol refinement.
--
-- Three tables:
--   treatments — main log record, references protocol_version_id
--                immutably (P4 versions are append-only)
--   treatment_photos — metadata for files in Supabase Storage
--   treatment_adverse_events — separate table so admin can query
--                without joining patient context every time
--
-- Storage bucket `treatment-photos` is created via a separate SQL
-- block (the storage schema requires admin privileges that aren't
-- available inside a regular migration run). See spec/SESSION-P6.
--
-- RLS: Class A (practice CRUD own; admin reads all). Adverse events
-- diverge — practice can only insert + read, admin manages status.
-- This keeps the audit trail honest: practice can't retroactively
-- delete an adverse event report, only admin can change status.
--
-- Ordering: tables → indexes → triggers → enable RLS → policies.
-- treatments references practice_authorized_users (P3) and
-- protocol_versions (P4) — both already live.
-- ============================================================
-- HOLD: review before applying to production Supabase. Per
-- CLAUDE.md database safety rules — never run automatically.
-- ============================================================

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

create table public.treatments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- RLS pivot
  practice_id uuid not null references public.practices(id) on delete cascade,

  -- Attribution: who at the practice entered this log.
  -- entered_by_name is denormalized so the log survives if the
  -- authorized user record is later edited or removed.
  entered_by_user_id uuid references public.practice_authorized_users(id) on delete set null,
  entered_by_name text not null,

  -- Treatment date may differ from created_at if logged after the fact.
  treatment_date date not null,

  -- Protocol references — version-locked at log time.
  -- protocol_version_id snapshot is immutable (P4 append-only policy)
  -- so the Data Intelligence Layer can compare outcomes across
  -- treatments referencing specific versions without drift.
  protocol_id uuid not null references public.protocols(id),
  protocol_version_id uuid not null references public.protocol_versions(id),
  protocol_version_label text not null,

  -- Optional protocol deviation
  protocol_deviation boolean not null default false,
  protocol_deviation_reason text,

  -- Patient context (de-identified)
  patient_anon_id text check (char_length(patient_anon_id) <= 40),
  patient_age_range text not null check (patient_age_range in (
    'under_18', '18_25', '26_35', '36_45', '46_55', '56_65', 'over_65'
  )),
  patient_fitzpatrick text not null check (patient_fitzpatrick in (
    'I', 'II', 'III', 'IV', 'V', 'VI'
  )),
  patient_sex text check (patient_sex in ('female', 'male', 'other', 'undisclosed')),

  -- Treatment context
  indication text not null,
  treatment_site text check (char_length(treatment_site) <= 200),
  session_number integer not null check (session_number > 0),

  -- Parameters delivered
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

  -- Free-text notes
  notes text check (char_length(notes) <= 4000),

  -- Outcome (initial — P7 may add follow-up updates)
  has_followup boolean not null default false,
  followup_completed_at timestamptz,

  -- Constraint: deviation_reason required if protocol_deviation = true
  constraint treatments_deviation_reason_required check (
    protocol_deviation = false or protocol_deviation_reason is not null
  )
);

create table public.treatment_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,

  storage_path text not null,
  filename text not null,
  mime_type text not null,
  byte_size integer not null check (byte_size > 0),

  capture_phase text check (capture_phase in ('before', 'during', 'after', 'followup')),
  caption text check (char_length(caption) <= 500),

  -- Patient consent affirmed at upload time. Required when ANY photo
  -- is attached to a treatment (enforced at the API layer; this row
  -- can't exist without consent_affirmed=true under normal flow).
  consent_affirmed boolean not null default false
);

create table public.treatment_adverse_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  treatment_id uuid not null references public.treatments(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,

  description text not null,

  -- Admin workflow
  status text not null default 'new' check (status in (
    'new', 'reviewing', 'addressed'
  )),
  status_changed_at timestamptz default now(),
  status_changed_by uuid references auth.users(id),
  admin_notes text,

  -- One adverse event per treatment (extensible later if needed —
  -- spec keeps it simple, single description per treatment).
  unique(treatment_id)
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------

create index idx_treatments_practice_id on public.treatments(practice_id);
create index idx_treatments_protocol_id on public.treatments(protocol_id);
create index idx_treatments_protocol_version_id on public.treatments(protocol_version_id);
create index idx_treatments_treatment_date on public.treatments(treatment_date desc);
create index idx_treatments_indication on public.treatments(indication);
create index idx_treatments_fitzpatrick on public.treatments(patient_fitzpatrick);

create index idx_treatment_photos_treatment_id on public.treatment_photos(treatment_id);
create index idx_treatment_photos_practice_id on public.treatment_photos(practice_id);

create index idx_adverse_events_status on public.treatment_adverse_events(status);
create index idx_adverse_events_practice_id on public.treatment_adverse_events(practice_id);
create index idx_adverse_events_created_at on public.treatment_adverse_events(created_at desc);

-- ------------------------------------------------------------
-- Triggers
-- ------------------------------------------------------------

create trigger trg_treatments_updated_at
  before update on public.treatments
  for each row execute function public.set_updated_at();

create trigger trg_adverse_events_updated_at
  before update on public.treatment_adverse_events
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Enable RLS
-- ------------------------------------------------------------

alter table public.treatments enable row level security;
alter table public.treatment_photos enable row level security;
alter table public.treatment_adverse_events enable row level security;

-- ------------------------------------------------------------
-- Policies
-- ------------------------------------------------------------

-- treatments — Class A (practice CRUD own, admin all)
create policy "treatments admin all"
  on public.treatments for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "treatments practice crud own"
  on public.treatments for all
  using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

-- treatment_photos — same Class A
create policy "treatment_photos admin all"
  on public.treatment_photos for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "treatment_photos practice crud own"
  on public.treatment_photos for all
  using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  )
  with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

-- treatment_adverse_events — diverges from Class A.
-- Practice can INSERT and SELECT own (so they can confirm their
-- submission landed) but cannot UPDATE or DELETE — that's admin's
-- job. This keeps the clinical-incident audit trail honest.
create policy "adverse_events admin all"
  on public.treatment_adverse_events for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "adverse_events practice insert own"
  on public.treatment_adverse_events for insert
  with check (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );

create policy "adverse_events practice read own"
  on public.treatment_adverse_events for select
  using (
    public.is_practice()
    and practice_id = public.current_practice_id()
  );
