-- ============================================================
-- Precise Aesthetics — Stack reference seed (P13)
-- ============================================================
-- Pre-populates the stack_services and stack_env_vars tables
-- with the production stack as it exists at P13 ship time.
-- Sourced from audits/PROD-ENV-VERIFICATION.md.
--
-- Idempotent — safe to re-run. Adds a unique constraint on
-- stack_services.name first so ON CONFLICT clauses can target it.
--
-- After applying, operator edits records via the admin UI
-- (/admin/settings/stack/[id]) to fill in plan tier, monthly cost,
-- credentials storage location, account owner, etc.
--
-- CRITICAL: NO secret values in this seed. Only env var names
-- and the boolean flags indicating where each is set.
-- ============================================================
-- HOLD: review before applying. Per CLAUDE.md DB safety rules.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Unique constraint on service name (enables idempotent seed)
-- ------------------------------------------------------------
-- 0015 created an index on name but not a unique constraint.
-- Adding it here so ON CONFLICT (name) targets a real arbiter.
alter table public.stack_services
  add constraint stack_services_name_key unique (name);

-- ------------------------------------------------------------
-- 2. Seed services
-- ------------------------------------------------------------
-- One row per external service we depend on at P13 ship.
-- created_by / last_updated_by intentionally NULL — no real
-- admin user owns these bootstrap rows. Edit via UI to assign
-- account_owner_user_id post-apply.
insert into public.stack_services
  (name, category, what_it_does, login_url, status, notes)
values
  (
    'Vercel',
    'hosting',
    'Production hosting + serverless functions + edge middleware. Aliased to https://preciseaesthetics.com.',
    'https://vercel.com/dashboard',
    'active',
    'Source of truth for production env vars. Use `vercel env ls production` to inventory.'
  ),
  (
    'Supabase',
    'database',
    'Postgres database, Auth, and Storage. RLS enforced across all portal/admin tables.',
    'https://supabase.com/dashboard',
    'active',
    'Plan tier ≥ Pro required for daily backups + PITR. Verify Site URL = https://preciseaesthetics.com (CLAUDE.md known gotcha).'
  ),
  (
    'Resend',
    'email',
    'Transactional email — practice invites, lead welcomes, internal notifications, password resets.',
    'https://resend.com/dashboard',
    'active',
    'Domain preciseaesthetics.com must be verified (SPF + DKIM + return-path). Check domain status before launch.'
  ),
  (
    'Sanity',
    'cms',
    'Headless CMS for the protocol library + indication taxonomy. Studio embedded at /studio.',
    'https://www.sanity.io/manage',
    'active',
    'Webhook on protocol publish → POST /api/webhooks/sanity/protocol with HMAC-SHA256. Secret matches SANITY_WEBHOOK_SECRET.'
  ),
  (
    'Anthropic',
    'ai',
    'Claude API — powers all 6 admin agents (Pattern, Protocol, Practice Health, Comm, Query, Lead Enricher) plus the help chatbot.',
    'https://console.anthropic.com',
    'active',
    'Pay-as-you-go. Sonnet 4.5 = $3/$15 per 1M (in/out). Haiku 4.5 = $1/$5. Set spend cap on the account.'
  ),
  (
    'PostHog',
    'analytics',
    'Product analytics + event capture. Server-side via /lib/analytics/posthog-server.ts; client-side init in marketing layout.',
    'https://us.posthog.com',
    'active',
    null
  ),
  (
    'Cal.com',
    'other',
    'Demo booking — embedded on /demo. Cloud free tier.',
    'https://app.cal.com',
    'active',
    'Embed link is in NEXT_PUBLIC_CAL_LINK. Update if the booking page URL changes.'
  ),
  (
    'Sentry',
    'monitoring',
    'Error monitoring + source-map symbolication. Wired in P12 — operator provisions DSN.',
    'https://sentry.io',
    'active',
    'HIPAA posture: replays OFF, sendDefaultPii false. Source-map upload runs at build when SENTRY_AUTH_TOKEN is set.'
  ),
  (
    'GitHub',
    'other',
    'Code hosting + version control. Repo: psrxbodyandskin/precise-aesthetics. Auto-deploy to Vercel on push to master.',
    'https://github.com/psrxbodyandskin/precise-aesthetics',
    'active',
    null
  )
on conflict (name) do nothing;

-- ------------------------------------------------------------
-- 3. Seed env vars per service
-- ------------------------------------------------------------
-- One row per env var our code reads. Each is anchored to the
-- service it belongs to via a name-lookup subquery. Names taken
-- verbatim from .env.example + the Vercel inventory in
-- audits/PROD-ENV-VERIFICATION.md.
--
-- Truth at seed time:
--   - All vars listed are set in Vercel production (verified P12)
--   - Most also live in .env.local for dev
--   - is_secret defaults to true for most; auto-false for NEXT_PUBLIC_*
--     in the API route. Seed sets it explicitly here for clarity.

-- helper macro: insert env var by service name lookup
-- (writing as repeated WITH/INSERTs since plpgsql blocks add complexity
-- without much win for a one-time seed)

insert into public.stack_env_vars
  (service_id, var_name, description, set_in_vercel, set_in_local_env, is_secret)
select s.id, v.var_name, v.description, v.set_in_vercel, v.set_in_local_env, v.is_secret
from (values
  -- Supabase ---------------------------------------------------
  ('Supabase', 'NEXT_PUBLIC_SUPABASE_URL',         'Supabase project URL — used by client + server.',                                        true, true, false),
  ('Supabase', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',    'Anon-role public key for client-side Supabase queries (RLS-enforced).',                  true, true, false),
  ('Supabase', 'SUPABASE_SERVICE_ROLE_KEY',        'Service-role key — server-only. Bypasses RLS. Used by getServiceClient().',              true, true, true),
  -- Resend -----------------------------------------------------
  ('Resend',   'RESEND_API_KEY',                   'Resend API key — server-only. lib/resend/send.ts is import "server-only".',              true, true, true),
  ('Resend',   'RESEND_FROM_EMAIL',                'Sender address shown on every transactional email. Must be a verified sender in Resend.', true, true, false),
  ('Resend',   'RESEND_INTERNAL_NOTIFY_EMAIL',     'Admin notification recipient (Brian + Roni inbox).',                                      true, true, false),
  -- Sanity -----------------------------------------------------
  ('Sanity',   'NEXT_PUBLIC_SANITY_PROJECT_ID',    'Sanity project id — used by client + server.',                                            true, true, false),
  ('Sanity',   'NEXT_PUBLIC_SANITY_DATASET',       'Sanity dataset name (production / staging).',                                             true, true, false),
  ('Sanity',   'SANITY_API_READ_TOKEN',            'Server-side read token. Used by next-sanity for ISR fetches.',                            true, true, true),
  ('Sanity',   'SANITY_WEBHOOK_SECRET',            'HMAC secret verifying inbound publish webhooks at /api/webhooks/sanity/protocol.',        true, true, true),
  ('Sanity',   'SANITY_REVALIDATE_SECRET',         'Shared secret for /api/revalidate path-based revalidation.',                              true, true, true),
  -- Anthropic --------------------------------------------------
  ('Anthropic', 'ANTHROPIC_API_KEY',               'Anthropic Claude API key. Server-only. Read by lib/anthropic/client.ts.',                 true, true, true),
  -- PostHog ----------------------------------------------------
  ('PostHog', 'NEXT_PUBLIC_POSTHOG_KEY',           'PostHog project key — used by client + server.',                                          true, true, false),
  ('PostHog', 'NEXT_PUBLIC_POSTHOG_HOST',          'PostHog ingest host (e.g. https://us.i.posthog.com).',                                    true, true, false),
  -- Cal.com ----------------------------------------------------
  ('Cal.com', 'NEXT_PUBLIC_CAL_LINK',              'Public Cal.com booking-link slug embedded on /demo.',                                     true, true, false),
  -- Sentry (operator pending) ---------------------------------
  ('Sentry',  'SENTRY_DSN',                        'Sentry server-side DSN. Pending operator handoff per audits/SENTRY-WIRING.md.',           false, false, true),
  ('Sentry',  'NEXT_PUBLIC_SENTRY_DSN',            'Sentry browser DSN (typically same value as SENTRY_DSN).',                                false, false, false),
  ('Sentry',  'SENTRY_ORG',                        'Sentry org slug. Build-time only — used for source-map upload.',                          false, false, false),
  ('Sentry',  'SENTRY_PROJECT',                    'Sentry project slug. Build-time only.',                                                   false, false, false),
  ('Sentry',  'SENTRY_AUTH_TOKEN',                 'Sentry auth token. Build-time only — required for source-map upload.',                    false, false, true),
  -- Vercel (site config rolled under hosting) ------------------
  ('Vercel',  'NEXT_PUBLIC_SITE_URL',              'Production site URL — drives OG metadata, sitemap, redirect bases.',                      true, true, false)
) as v(service_name, var_name, description, set_in_vercel, set_in_local_env, is_secret)
join public.stack_services s on s.name = v.service_name
on conflict (service_id, var_name) do nothing;

-- ============================================================
-- Operator follow-up after applying:
--
-- 1. /admin/settings/stack — visit, confirm 9 services + their env vars
--    appear under the correct categories.
-- 2. Edit each service to fill in:
--      plan_tier (e.g. "Pro")
--      monthly_cost_estimate_usd (e.g. 25.00)
--      renewal_date
--      credentials_storage_location (e.g. password manager path)
--      account_owner_user_id (Brian or Roni)
-- 3. Sentry env vars currently flagged set_in_vercel=false. Once
--    the DSN handoff is complete and `vercel env add` runs,
--    flip those rows in the UI.
-- 4. Anthropic env var rotation (per P12 transcript paste) —
--    after rotating, no schema change needed; just confirm the
--    var name is unchanged.
-- ============================================================
