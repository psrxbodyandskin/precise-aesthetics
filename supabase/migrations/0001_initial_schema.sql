-- ============================================================
-- Precise Aesthetics — Initial Schema (Session 2)
-- ============================================================
-- Tables: leads, demo_requests, event_rsvps, practitioners, treatment_logs
-- RLS enabled on all tables. Public writes go through service-role API routes.
-- Practitioners read/write their own rows. Admins read all.
-- HIPAA-aware: no PHI lives in Sanity. Treatment logs use de-identified
-- profile data only.
-- ============================================================

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
-- Defined later in Session 11 (portal build).
-- ============================================================

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================
alter table public.leads enable row level security;
alter table public.demo_requests enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.practitioners enable row level security;
alter table public.treatment_logs enable row level security;

-- Public form submissions go through service-role API routes — service role
-- bypasses RLS. No user-facing INSERT policies are needed for leads,
-- demo_requests, or event_rsvps.

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

-- Admins (is_admin = true) can read all practitioners and treatment logs
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
