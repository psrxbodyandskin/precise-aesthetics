-- ============================================================
-- Precise Aesthetics — Contact Messages (Session 9)
-- ============================================================
-- General contact form submissions from /contact. Mirrors the
-- demo_requests pipeline (service-role API insert, no public
-- read/write). Service-role client bypasses RLS, so no public
-- INSERT policy is required.
-- ============================================================

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  organization text,
  subject text not null,
  message text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text
);

create index idx_contact_messages_created_at
  on public.contact_messages (created_at desc);

create index idx_contact_messages_email
  on public.contact_messages (lower(email));

alter table public.contact_messages enable row level security;

-- Service-role only for now; no public read/write access.
-- All inserts flow through /api/contact using the service-role client.
