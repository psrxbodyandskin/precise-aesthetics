# Session P12 — Critical Hardening + Launch Runbook

> Final pre-launch session. Hardens the system across security, RLS, end-to-end flows, environment configuration, and produces a launch runbook. Polish pass (Lighthouse, accessibility AA, edge-case copy) deferred to a P12.5 autonomous session Opus runs after this lands.

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/PORTAL-MASTER-SPEC.md`
6. `spec/RLS-PATTERNS.md`
7. **All session specs P1 through P11** (this is the integration check — every prior session's claims must be verified)
8. This spec

---

## The Use Case

It's the week before Aug 8 launch. The build is feature-complete. Practitioners will start using it on launch day. Adverse events will be reported. Treatment data will flow. Roni will use AI agents. You'll work the inbox.

This session is the final check that everything claimed in P1-P11 actually works, security is real, and Roni + you have a runbook for launch day and after.

---

## Goal

After this session:
- **RLS audit complete** — every table's policies verified by automated test that signs in as different roles and confirms expected access/denial
- **Security review complete** — env vars audit, service-role key audit, auth boundary verification, dependency vulnerability scan
- **End-to-end critical flows verified** — eight named flows pass automated + manual testing
- **Production environment verified** — every required env var set on Vercel, Resend domain verified, Supabase connection tested
- **Backup and monitoring in place** — database backups confirmed enabled, error monitoring wired (Sentry)
- **Launch runbook delivered** — `LAUNCH-RUNBOOK.md` covers pre-launch, launch day, post-launch monitoring, common issue triage, rollback procedure

---

## What Gets Built

### Verification infrastructure
- Automated RLS audit script — sets up test users for each role, runs queries, asserts policies
- Security audit checklist run with findings documented
- End-to-end critical flow tests using Playwright or similar (or manual sequenced testing if test infra is too heavy)

### Documentation
- `LAUNCH-RUNBOOK.md` — comprehensive operational document
- `SECURITY-AUDIT-RESULTS.md` — findings from the security review
- `RLS-AUDIT-RESULTS.md` — RLS policy verification results
- `KNOWN-GOTCHAS.md` — consolidated from CLAUDE.md "Known Gotchas" + new findings

### Production hardening (where issues are found)
- Fix any RLS gaps discovered in audit
- Fix any security issues found in review
- Wire up Sentry error monitoring
- Verify Supabase backup retention settings
- Document any deferrable findings as known issues

---

## Critical Constraints

1. **No new features.** P12 is hardening. If the audit reveals a missing feature, document it as a P13 (post-launch) item, don't build it now.
2. **MASTER.md tokens only** for any UI changes (only fixing bugs, not redesigning).
3. **All migrations held** for manual review.
4. **Don't ship breaking changes.** Any fix that requires schema changes must be reviewed and discussed before applying.
5. **Document everything found.** Even "this passed" findings get documented — the runbook is the record.
6. **Reduced motion respected** in any UI fixes.

---

# RLS AUDIT

## Approach

Build a test script (`scripts/rls-audit.ts`) that:
1. Provisions four test users: admin, practice A, practice B, anonymous
2. For each table in the database, runs SELECT/INSERT/UPDATE/DELETE attempts as each user
3. Asserts expected outcome (allowed or denied) per RLS policy intent
4. Reports a matrix of pass/fail per (table, user, operation)

## Tables to audit

Every table touched by any session:

**Core:**
- practices, practice_users, practice_authorized_users, practice_devices, devices, audit_log

**Protocols (P4):**
- protocols, protocol_versions, protocol_devices, indication_categories

**Treatments (P6):**
- treatments, treatment_photos, treatment_adverse_events

**Inbox (P8):**
- leads, demo_requests, contact_messages

**Training (P9):**
- training_modules, training_curricula, curriculum_modules, module_materials, module_progress, practice_user_certifications

**Notifications (P10):**
- notifications, notification_preferences, notification_dispatch_log

**AI (P11):**
- agent_runs

## Expected access matrix

For each table, document the expected matrix as part of the audit. Example:

```
practices:
  admin:        SELECT ✓ INSERT ✓ UPDATE ✓ DELETE ✓
  practice A:   SELECT ✓ (own) INSERT ✗ UPDATE ✗ DELETE ✗
  practice B:   SELECT ✗ (other practice) INSERT ✗ UPDATE ✗ DELETE ✗
  anonymous:    SELECT ✗ INSERT ✗ UPDATE ✗ DELETE ✗

treatments:
  admin:        SELECT ✓ INSERT ✓ UPDATE ✓ DELETE ✓
  practice A:   SELECT ✓ (own) INSERT ✓ (own) UPDATE ✓ (own) DELETE ✓ (own)
  practice B:   SELECT ✗ INSERT ✗ UPDATE ✗ DELETE ✗
  anonymous:    SELECT ✗ INSERT ✗ UPDATE ✗ DELETE ✗

leads:
  admin:        SELECT ✓ INSERT ✓ UPDATE ✓ DELETE ✓
  practice A:   SELECT ✗ INSERT ✗ UPDATE ✗ DELETE ✗
  practice B:   SELECT ✗ INSERT ✗ UPDATE ✗ DELETE ✗
  anonymous:    SELECT ✗ INSERT ✓ (form submission) UPDATE ✗ DELETE ✗
```

Every row in this matrix gets verified by the script.

## Storage RLS audit

Same approach for Supabase Storage buckets:
- treatment-photos (per-practice path access)
- training-videos (admin write, all auth read)
- training-materials (admin write, all auth read)

Test by attempting upload/download as each role, verify expected outcome.

## Output

`RLS-AUDIT-RESULTS.md` — table-by-table verification with pass/fail per (table, user, operation). Any failure becomes a hard-fix item before launch.

---

# SECURITY AUDIT

## Audit checklist

Run through every item, document findings:

### Secrets and credentials
- [ ] `ANTHROPIC_API_KEY` is server-only — confirm no client component imports the key
- [ ] Supabase service-role key is server-only — confirm no client bundle includes it
- [ ] `RESEND_API_KEY` is server-only
- [ ] `SANITY_WEBHOOK_SECRET` is server-only
- [ ] Run `grep -r "process.env" components/` — confirm no env vars referenced in client components except `NEXT_PUBLIC_*`
- [ ] Run build, inspect bundle output — search for any leaked secret pattern

### Auth boundaries
- [ ] `requireAdmin()` enforced on every `/api/admin/*` route
- [ ] `requirePractice()` enforced on every `/api/portal/*` route (or `requireUser()` where shared)
- [ ] `/admin/*` and `/portal/*` middleware enforces routing per role
- [ ] Magic link disabled on `/admin/login` (verified)
- [ ] Open-redirect protection on auth callback (verified)
- [ ] Session cookies HTTP-only, secure flag set
- [ ] Password reset flow doesn't reveal email existence

### Database access
- [ ] All tables have RLS enabled (verify via `pg_class`)
- [ ] Service-role usage is intentional and limited (audit `getServiceClient()` callers)
- [ ] Audit log is append-only (verified — no UPDATE/DELETE policies)
- [ ] No `security definer` functions without `is_admin()` or equivalent gate
- [ ] No `bypassrls` set anywhere

### Third-party
- [ ] Sanity webhook signature verification works (test with bad signature)
- [ ] Resend API key not exposed in any logs
- [ ] Supabase project Site URL set to production domain (not localhost)
- [ ] CORS posture: API routes don't accept arbitrary origins

### Headers and policies
- [ ] CSP (Content Security Policy) — review and tighten if generic
- [ ] X-Frame-Options set to DENY (or SAMEORIGIN)
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] HSTS via Vercel default

### Dependencies
- [ ] Run `npm audit` — document any high/critical findings
- [ ] Verify all dependencies pinned to specific versions in package.json
- [ ] No abandoned dependencies (last published >24 months ago)

### Data exposure
- [ ] Patient identifiers never stored — verify treatment fields are de-identified
- [ ] EXIF stripping verified working — upload test photo with GPS, fetch from Storage, confirm no EXIF
- [ ] No PHI in logs — audit log entries don't include treatment notes or patient context

### Rate limiting
- [ ] Public form endpoints rate-limited (lead, demo, contact — confirm middleware)
- [ ] Auth endpoints rate-limited (login, password reset)
- [ ] Agent endpoints rate-limited per admin user (prevent runaway costs)

## Output

`SECURITY-AUDIT-RESULTS.md` — every checklist item with pass/fail/finding. Any fail blocks launch. Findings classified: critical (block launch), high (fix before launch), medium (fix in P12.5), low (post-launch).

---

# END-TO-END CRITICAL FLOWS

Eight flows. Each must be verified working — automated tests preferred, manual sequenced testing acceptable if automation is too heavy.

## Flow 1 — Practice provisioning + onboarding
1. Admin signs in at `/admin/login`
2. Admin provisions a practice via `/admin/practices/new`
3. Resend sends invite email to test inbox
4. Practice clicks invite link → lands on setup wizard
5. Practice completes 7-step wizard
6. Practice status flips to `active`
7. Practice arrives at `/portal` dashboard

## Flow 2 — Training to certification
1. Admin authors training curriculum + 2 modules in `/admin/training`
2. Practice signs in to portal
3. Practice picks training user via TrainingUserPicker
4. Practice watches both videos to >=90%
5. Practice acknowledges + marks each module complete
6. Practice clicks "Complete certification"
7. Certification record created with correct user attribution
8. Certificate page renders + prints cleanly

## Flow 3 — Treatment logging (gated)
1. Practice tries `/portal/treatments/new` BEFORE certification → blocked state
2. After Flow 2 completes → practice tries again
3. Treatment form renders with protocol selector limited to certified-device protocols
4. Practice fills form (entered_by from authorized users dropdown)
5. Practice uploads photo (verify EXIF stripped)
6. Practice flags adverse event → submits
7. Treatment row created
8. Adverse event row created
9. Admin receives email + in-app notification (`adverse_event.new`)
10. Admin reviews adverse event in `/admin/adverse-events`
11. Admin marks as addressed
12. Practice receives notification (`adverse_event.status_updated`)

## Flow 4 — Marketing form to admin inbox
1. Anonymous user submits `/lead` form
2. Lead row created
3. Admin receives in-app notification (`inbox.new_lead`)
4. Admin sees lead in `/admin/inbox`
5. Lead Enricher auto-runs, populates `enrichment_data`
6. Admin advances status: new → contacted → qualified → closed
7. Audit log entries written for each status change
8. Repeat with /demo and /contact submissions

## Flow 5 — Protocol publish to practitioner notification
1. Roni edits a protocol in Sanity Studio
2. Roni publishes
3. Sanity webhook fires
4. Supabase mirror updated, new version snapshot created
5. Practices that previously logged treatments with this protocol receive notification (`protocol.updated_for_used_protocol` — mandatory, in-app + email)
6. Practices owning the device but not previously using receive notification (`protocol.new_for_owned_device` — mutable, in-app only)
7. Practitioner views protocol → sees new version

## Flow 6 — AI agent execution
1. Admin clicks "Analyze outcomes" on dashboard
2. Pattern Analyst runs
3. agent_runs row created with model, tokens, cost, latency, parsed output
4. Result displays inline, markdown rendered correctly
5. Admin clicks "Replay" → new run with replay_of_id linkage
6. Cost dashboard reflects both runs

## Flow 7 — Query Assistant SQL safety
1. Admin asks legitimate question → SQL generated, validated, executed, answer rendered
2. Admin asks question that would generate UPDATE → blocked at regex layer with clear error
3. Admin asks question referencing auth.users → blocked
4. Long-running query → 10-second timeout enforced

## Flow 8 — Notification preferences + quiet hours
1. Admin sets quiet hours 22:00-07:00 CST
2. Lead submitted at 23:00 CST → in-app notification fires, email skipped (logged)
3. Adverse event submitted at 23:00 CST → email sent regardless (mandatory category)
4. Admin mutes `inbox.new_lead`
5. Lead submitted → no in-app notification, no email
6. Admin un-mutes → next lead triggers normally

Each flow gets a section in `END-TO-END-VERIFICATION.md` with pass/fail and any issues encountered.

---

# PRODUCTION ENVIRONMENT VERIFICATION

## Vercel environment variables

Required vars to verify set in production:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Site
NEXT_PUBLIC_SITE_URL=https://preciseaesthetics.com

# Resend
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_INTERNAL_NOTIFY_EMAIL

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET
SANITY_API_TOKEN
SANITY_WEBHOOK_SECRET

# PostHog
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST

# Anthropic
ANTHROPIC_API_KEY

# Optional
SENTRY_DSN (if added)
```

Verify each is set with the correct value. Document any missing or wrong.

## Resend domain verification
- Confirm `preciseaesthetics.com` is verified in Resend dashboard
- DNS records (SPF, DKIM, return-path) set on registrar
- Send test email through each template, confirm delivery

## Supabase configuration
- Site URL set to `https://preciseaesthetics.com`
- Additional Redirect URLs include `http://localhost:3457` for dev
- Database backups enabled (daily, 7-day retention minimum)
- Project plan supports expected concurrent connections

## Sanity webhook configuration
- Webhook configured per `spec/SANITY-WEBHOOK-SETUP.md`
- Test publish triggers webhook
- Webhook secret matches Vercel env

---

# ERROR MONITORING

Wire up Sentry (or equivalent — Sentry is the recommendation):

1. Install `@sentry/nextjs`
2. Run setup wizard
3. Add `SENTRY_DSN` to Vercel
4. Configure source map upload on build
5. Test by triggering an error in dev → verify it appears in Sentry dashboard
6. Set up alerts: error rate spike, new error types, critical error categories

Document Sentry project URL and access in launch runbook.

---

# DATABASE BACKUP VERIFICATION

Supabase plan determines backup retention:
- Free tier: 7-day point-in-time recovery
- Pro tier: 7-day daily backups + point-in-time recovery
- Verify the project is on at least Pro tier for clinical software

Document:
- Current Supabase plan
- Backup retention period
- Recovery procedure (steps to restore from backup)

---

# LAUNCH RUNBOOK

**File:** `LAUNCH-RUNBOOK.md` — the operational reference document.

## Sections to include

### Pre-launch (T-7 days)
- Final RLS audit pass (re-run script)
- Final security audit (re-run checklist)
- Migration audit (every migration applied to prod)
- Env var audit (every var set on Vercel)
- Resend domain verified, DNS healthy
- Sentry monitoring active
- Database backups confirmed running
- Test data cleared from production
- Test admin account created (you + Roni)
- Rollback plan documented

### Launch day (Aug 8)
- Sequence:
  1. Final smoke test on production at 8am
  2. Confirm test admin can sign in
  3. Confirm marketing forms submit cleanly
  4. Confirm Sanity webhook fires correctly
  5. Send announcement (whatever channel)
  6. Monitor Sentry continuously
  7. Monitor Vercel logs for 5xx spikes
  8. Be available for first practitioner provisioning request

### First-week monitoring
- Daily: review Sentry errors, Vercel logs, agent_runs cost
- Daily: review inbox for stuck items
- Weekly: review treatment volume, adverse event count, certification completion
- Weekly: cost review (Anthropic, Resend, Supabase, Vercel)

### Common issue runbook

For each, document: symptom, diagnosis, fix.

- "Practitioner can't log in" → check Supabase auth.users, check app_metadata.role + practice_id, check practice status
- "Marketing form submission fails" → check Resend, check Supabase RLS, check rate limit
- "Email not arriving" → check Resend logs, check domain verification, check spam
- "Sanity webhook not firing" → check webhook config, check secret, check Vercel logs at /api/webhooks/sanity/protocol
- "AI agent runs failing" → check ANTHROPIC_API_KEY, check Anthropic status page, check agent_runs.error_message
- "RLS blocking unexpectedly" → check user's app_metadata, check current_practice_id() returns expected value
- "Photos not uploading" → check storage bucket policies, check practice_id matches storage path
- "Notification not appearing" → check notification table for the event_id, check dispatch_log for failures
- "Adverse event not surfacing in admin" → check treatment_adverse_events table, check admin notification dispatch

### Rollback procedure
- If a deploy breaks production:
  1. Vercel → Deployments → Find last working deploy → "Promote to Production"
  2. If schema migration needs reverting: only do this with explicit team review
  3. Notify Roni + you immediately
  4. Document the failure in incident log

### Incident log
- Template for documenting issues that arise post-launch
- Date, symptom, diagnosis, fix, time-to-resolution

### Contact info (for emergencies)
- Vercel support
- Supabase support
- Anthropic support
- Resend support
- Domain registrar
- DNS provider

---

# P12.5 — POLISH PASS (Opus runs autonomously after P12)

After P12 ships and is approved, Opus runs P12.5 without further direction:

1. Lighthouse audit on every page; surface scores below target
2. Apply low-risk performance fixes (image optimization, lazy loading)
3. Accessibility audit on portal (WCAG AA): focus order, ARIA labels, contrast, keyboard nav
4. Edge-case empty state audit
5. Mobile/iPad regression sweep
6. Copy review (any inline strings that read awkward)
7. Documentation pass: README, CLAUDE.md, all session specs cross-referenced

Output: `P12.5-POLISH-RESULTS.md` with findings + fixes applied + remaining open items.

P12.5 ships fixes that don't require new specs or architectural decisions. If something requires a spec, it gets logged as P13 (post-launch) instead.

---

# VERIFICATION

P12 itself is verification work. The deliverables ARE the verification.

Final pre-delivery checks:
1. RLS audit script runs cleanly, all expected access controls verified
2. Security audit complete, all critical/high findings addressed
3. All 8 end-to-end flows pass
4. All required Vercel env vars verified set
5. Resend domain verified, test emails deliver
6. Sentry wired and tested
7. Database backups confirmed
8. Launch runbook complete and reviewed
9. `npm run build` clean
10. `npx tsc --noEmit` clean
11. `npm run lint` clean

---

# DELIVERABLES

When done, provide:

1. `RLS-AUDIT-RESULTS.md` — full matrix per table
2. `SECURITY-AUDIT-RESULTS.md` — checklist with findings + classifications
3. `END-TO-END-VERIFICATION.md` — 8 flows with pass/fail + notes
4. `LAUNCH-RUNBOOK.md` — comprehensive operational document
5. `KNOWN-GOTCHAS.md` — consolidated landmines reference
6. List of fixes applied during P12 (any RLS gaps, security issues, etc.)
7. List of items deferred to P12.5 polish
8. List of items deferred to P13 (post-launch)
9. Sentry project URL and access documentation
10. Any blockers identified that prevent launch
11. Final cost summary of test runs (AI + email + storage)
12. Anything else surfaced during the audit

After P12 is approved + all critical findings resolved + runbook delivered, P12.5 polish runs autonomously, and we're cleared for launch.
