-- Add interest array to leads so the teaser form can capture
-- which tracks a lead opted into (demo, launch_event, press).
alter table public.leads
  add column if not exists interest text[] not null default '{}';

-- Optional: index for filtering by interest membership.
create index if not exists leads_interest_gin_idx
  on public.leads using gin (interest);
