# Launch Runbook — Precise Aesthetics

**Launch:** Aug 8, 2026 · Civic Opera Building rooftop, Chicago
**Domain:** https://preciseaesthetics.com
**Maintainers:** Brian (technical), Roni (clinical/operational)

This is the operational reference. Pre-launch rituals, launch-day sequence, monitoring rhythm, common issue triage, rollback. Updated continuously.

> **Companion documents:**
> - `audits/RLS-AUDIT-RESULTS.md` — every table's policy verification
> - `audits/SECURITY-AUDIT-RESULTS.md` — security checklist + dependency upgrade record
> - `audits/END-TO-END-VERIFICATION.md` — the 8-flow dry-run protocol
> - `audits/PROD-ENV-VERIFICATION.md` — env var inventory + operator dashboard checks
> - `audits/SENTRY-WIRING.md` — Sentry handoff + verification
> - `audits/BACKUP-VERIFICATION.md` — backup posture + recovery procedures
> - `KNOWN-GOTCHAS.md` — consolidated landmines

---

## Pre-launch checklist (T-7 days)

A full pass at T-7. Anything failing here is a launch blocker.

### Audits + verification

- [ ] Re-run `scripts/rls-audit.ts` against local Supabase mirror of prod schema → all cells PASS
- [ ] Re-run `npm audit` → critical/high count = 0
- [ ] Walk all 8 flows in `audits/END-TO-END-VERIFICATION.md` → every flow signs off
- [ ] Re-run `npx tsc --noEmit` → EXIT 0
- [ ] Re-run `npx next build` → EXIT 0

### Production env

- [ ] All Vercel env vars from `audits/PROD-ENV-VERIFICATION.md` § 1 set
- [ ] **Operator dashboard checks** from `audits/PROD-ENV-VERIFICATION.md` § 2:
  - [ ] Supabase Auth Site URL = `https://preciseaesthetics.com`
  - [ ] Supabase Auth additional redirect URLs include `http://localhost:3457`
  - [ ] Supabase project tier ≥ Pro
  - [ ] Daily snapshots + PITR enabled, ≥7-day retention
  - [ ] Resend domain `preciseaesthetics.com` verified (SPF + DKIM + return-path)
  - [ ] Test send through every email template — all delivered
  - [ ] Sanity webhook configured per `spec/SANITY-WEBHOOK-SETUP.md`, secret matches `SANITY_WEBHOOK_SECRET`
  - [ ] Webhook test-fire from Sanity dashboard returns 200

### Monitoring

- [ ] Sentry project provisioned per `audits/SENTRY-WIRING.md` § Operator handoff
- [ ] `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` set in Vercel production
- [ ] `/api/admin/sentry-test` triggers a captured event; stack trace symbolicated
- [ ] Alert rules configured (new error types, error rate spike, critical category)

### Anthropic

- [ ] Old `ANTHROPIC_API_KEY` (pasted in P12 conversation transcript) **rotated** — new key in `.env.local` + Vercel prod
- [ ] Spend cap set on Anthropic account (recommend $200/month with 80% email alert)
- [ ] Cost dashboard at `/admin/ai/cost` reviewed — pre-launch test runs cleaned per Flow 6 cleanup

### Data hygiene

- [ ] Test data scan run (queries in `END-TO-END-VERIFICATION.md` § Test-data candidates) — list reviewed with Roni; pre-launch test rows deleted
- [ ] Storage `treatments/` folders for test treatments deleted

### Personnel

- [ ] Test admin account created for both Brian and Roni
- [ ] Both can sign in to `/admin/login` independently
- [ ] Roni walked through:
  - [ ] Provisioning a practice (Flow 1)
  - [ ] Inbox triage (Flow 4)
  - [ ] Adverse event handling (Flow 3 sub-flow 3d)
  - [ ] One AI agent run + cost dashboard interpretation (Flow 6)
  - [ ] Notifications + quiet hours (Flow 8)

### Rollback plan

- [ ] Last known-good Vercel deploy identified (`vercel ls` and pin the deploy URL)
- [ ] One-click rollback procedure tested at least once on a non-critical commit (see § Rollback procedure below)
- [ ] Supabase backup recovery procedure (Scenario A in `BACKUP-VERIFICATION.md`) reviewed

---

## Pre-launch checklist (T-3 days)

Lighter pass — focus on operator-side dashboard items + a re-run of E2E.

- [ ] Walk `END-TO-END-VERIFICATION.md` flows again (full 8) — fresh dated copy in `audits/runs/`
- [ ] Re-confirm Resend DNS still healthy (TXT/CNAME records still present at registrar)
- [ ] Re-confirm Supabase Site URL hasn't drifted
- [ ] Sentry receiving events — check that the dashboard shows a recent event (could be from a synthetic probe or real production noise)
- [ ] Cost review: `agent_runs.cost_usd` total for last 7 days, Resend spend, Vercel projected, Supabase usage
- [ ] Final test data clean

---

## Pre-launch checklist (T-1 day, evening before)

Tight, tightly-timed dry run.

- [ ] Brian + Roni both signed in concurrently to confirm session isolation
- [ ] Walk Flow 1 (provisioning) end-to-end on prod with a real new email address
- [ ] Walk Flow 4 (lead → inbox → enrichment → status workflow) on prod
- [ ] Confirm `/admin/dashboard` loads cleanly with all panels rendering
- [ ] Confirm `/portal` loads for the test practice
- [ ] All test data created tonight is **cleaned by 11pm CST**

---

## Launch day (Aug 8, 2026)

### 8:00 AM CST — Final smoke test

Brian, on prod:

- [ ] `https://preciseaesthetics.com/` loads, marketing forms submit cleanly (one of each: lead, demo, contact)
- [ ] Admin sign-in works (Brian + Roni both)
- [ ] `/admin/dashboard` renders without errors
- [ ] Sentry receiving — trigger `/api/admin/sentry-test`, confirm capture in dashboard within 60s
- [ ] Vercel deploy log: most recent prod deploy is the intended commit
- [ ] Cost dashboard: AI spend in expected range
- [ ] Test data cleaned overnight — no residue

### 8:30 AM CST — Sanity webhook fire test

- [ ] Roni edits + publishes a single non-content-changing tweak to a protocol in Sanity
- [ ] Webhook fires, returns 200 in Vercel logs
- [ ] `protocol_versions` row appended
- [ ] Notifications fan out as expected

### 9:00 AM CST — Send announcement

- Per the launch communication channel (whatever's planned)
- Be at a keyboard. Don't queue and walk away.

### 9:00 AM – 5:00 PM CST — Active monitoring

Brian's tabs open:

1. **Sentry** — refresh every 15 min; investigate any new issue
2. **Vercel logs** (the deployment dashboard) — watch for 5xx spikes
3. **Supabase dashboard** — watch for unusual query latency or connection saturation
4. **`/admin/inbox`** — first practitioner provisioning requests will land here
5. **`/admin/dashboard`** — first treatments + adverse events will surface here

Phone available — first practitioner provisioning request needs human-in-the-loop response from Roni.

### End of day

- [ ] Capture metrics: deploys triggered, errors captured, leads received, demos booked, sign-ins
- [ ] Cost review: Anthropic, Resend, Vercel, Supabase spend for the day
- [ ] Incident log entry for any issues encountered (template below)

---

## First-week monitoring rhythm

### Daily

- Sentry — review new issues; close fixed, escalate persistent
- Vercel deployments + logs — review any 5xx
- `agent_runs` cost — `/admin/ai/cost?range=7d` review
- `/admin/inbox` — clear stuck items; advance status workflows

### Weekly

- Treatment volume + adverse event count via `/admin/dashboard`
- Certification completion rate (which practices have certified users vs not)
- Cost review: all four services (Anthropic, Resend, Supabase, Vercel) — spending pattern matches expectation?

---

## Common issue runbook

For each: **Symptom** → **Diagnosis** → **Fix**.

### "Practitioner can't log in"

- **Symptom:** "I can't sign in" / Supabase returns "Invalid login credentials"
- **Diagnosis:**
  1. Check `auth.users` for the email — does the user exist?
  2. Check `app_metadata.role` and `app_metadata.practice_id` — both populated?
  3. Check `practices.status` for that practice — is it `active`?
  4. Check Supabase Auth Site URL — still set to prod domain?
- **Fix:**
  - Missing user → use `/admin/practices/[id]/resend-invite`
  - Wrong app_metadata → service-role update via SQL editor: `select auth.admin.update_user_by_id(...)` or via Supabase Dashboard → Authentication → User → Edit metadata
  - Practice suspended/archived → reactivate via admin UI
  - Wrong Site URL → CLAUDE.md known-gotcha; fix in Supabase dashboard, no code change needed

### "Marketing form submission fails"

- **Symptom:** Form returns error toast / `429` / `500`
- **Diagnosis:**
  1. Browser network tab — read the actual response
  2. `429` → rate limit hit (5/IP/min for public forms). Real attacker or just a genuine retry storm? Check Vercel logs for IP frequency
  3. `500` → check Sentry for the captured error
  4. Check `leads` / `demo_requests` / `contact_messages` table — was the row written?
- **Fix:**
  - Rate-limit false-positive → wait 60s and retry; if persistent, check if Vercel is stuck on cold-start lambdas (in-memory rate-limit can over-count due to load distribution)
  - 500 → diagnose specific error from Sentry. Common causes: Resend down (lead lands but email fails — non-blocking), Supabase connection saturation
  - Row written but client errored → confirm with the user that submission worked despite the error message; fix UI state if it's a UI-only bug

### "Email not arriving"

- **Symptom:** Practitioner / lead / admin reports they didn't get expected email
- **Diagnosis:**
  1. Resend dashboard → search by recipient email → did Resend attempt delivery?
  2. If yes + `delivered`: check spam folder; check the recipient's email host blacklist
  3. If yes + `bounced`: address invalid; correct in DB
  4. If no: check `notification_dispatch_log` for skip reason (`quiet_hours`, `muted`, `category_disabled`)
  5. If no record at all: check Vercel logs — did the dispatcher run? Did the API call to Resend throw?
- **Fix:**
  - Spam → ask recipient to whitelist `RESEND_FROM_EMAIL`
  - DNS regression → re-verify domain in Resend dashboard
  - Code error → Sentry will have captured

### "Sanity webhook not firing"

- **Symptom:** Roni publishes a protocol; nothing changes in `/admin` or `/portal`
- **Diagnosis:**
  1. Sanity dashboard → API → Webhooks → recent attempts. 200? 400? 500?
  2. If 400 with "Invalid signature" → secret mismatch
  3. If 500 → check Vercel logs at `/api/webhooks/sanity/protocol`
  4. If 0 attempts shown → webhook is disabled or the trigger filter excludes the published doc
- **Fix:**
  - Signature mismatch → `vercel env ls` confirms `SANITY_WEBHOOK_SECRET`; copy from Vercel to Sanity webhook config
  - Filter wrong → review the filter in Sanity webhook config; should match `_type == "protocol"`
  - Code error → diagnose from Sentry

### "AI agent runs failing"

- **Symptom:** Admin clicks "Analyze patterns" → red error panel
- **Diagnosis:**
  1. `/admin/ai/runs` — find the failed row → click in → read `error_message`
  2. Common errors: `Anthropic invalid API key` (env var rotated wrong), `429 rate_limit_exceeded` (Anthropic account-level), `Cannot connect to api.anthropic.com` (Anthropic outage), `agent rate limit reached` (our P12 in-app cap of 20/admin/hour hit)
- **Fix:**
  - Invalid key → re-verify `ANTHROPIC_API_KEY` in Vercel
  - Anthropic 429 → check Anthropic console for usage; consider a temp spend bump
  - In-app rate limit → wait an hour OR restart the Vercel deploy (in-memory bucket clears)
  - Anthropic outage → status.anthropic.com; nothing to do but wait

### "RLS blocking unexpectedly"

- **Symptom:** Practice user reports a feature isn't loading data they should see
- **Diagnosis:**
  1. Check the user's `app_metadata` — is `role: practice` set? Is `practice_id` set to the right practice UUID?
  2. Run the same query in SQL editor as the user's role to reproduce
  3. Check the table's RLS policies (`select * from pg_policies where tablename = '...'`)
- **Fix:**
  - Wrong app_metadata → service-role update
  - Policy actually wrong → log incident, schedule a migration in P13 (don't hot-fix policies in production without review)

### "Photos not uploading"

- **Symptom:** Upload progresses then errors at the end
- **Diagnosis:**
  1. Browser network tab — what's the failing call?
  2. EXIF stripping (client-side canvas) failing on weird format? Check console for `processPhotoForUpload` errors
  3. Storage upload fails — RLS policy on the bucket? Path mismatch with `practice_id`?
  4. File size exceeds Storage limit?
- **Fix:**
  - Format issue → the practitioner uploads a different file; document the failing format for P12.5
  - RLS → confirm user is signed in and is a member of the right practice
  - Size → Storage bucket policies typically cap at 50MB per object; check the file

### "Notification not appearing"

- **Symptom:** "Bell shows nothing but I expected a new lead alert"
- **Diagnosis:**
  1. `select * from notifications where recipient_id = '<auth_user_id>' order by created_at desc limit 10`
  2. `select * from notification_dispatch_log where event_id like '<expected_pattern>' order by created_at desc limit 10`
  3. Check `notification_preferences` — has the recipient muted the category?
  4. Check quiet hours
- **Fix:**
  - Muted → user needs to un-mute (or category is intentionally muted)
  - Quiet hours → in-app for mandatory categories should fire regardless; if it didn't, that's a bug to log
  - No row at all → dispatch never ran; check Vercel logs at the originating API route

### "Adverse event not surfacing in admin"

- **Symptom:** Practice flagged AE; admin reports they didn't see it
- **Diagnosis:**
  1. `select * from treatment_adverse_events where treatment_id = '<id>'` — row exists?
  2. `notifications` for `adverse_event.new` category — fired?
  3. `notification_dispatch_log` — email channel `success` or `skipped`?
  4. Resend → did the email get delivered?
- **Fix:**
  - Row missing → form submission lost. Check Sentry for the API error
  - Notification missing → P10 dispatcher path; check Vercel logs for the original POST
  - Email skipped → quiet-hours or muted (mandatory should override; if it didn't, log incident)

---

## Rollback procedure

If a deploy breaks production:

1. **Don't panic.** Vercel rollback is one-click and instant.
2. Vercel Dashboard → project → Deployments → find the last known-good deploy → "**Promote to Production**"
3. Production traffic shifts immediately (~5–10s)
4. Verify the rollback landed: hit `https://preciseaesthetics.com/`, confirm the old behavior is back
5. Notify Roni (and Brian, if Roni rolled back)
6. Document the failure in the **Incident log** below
7. **Schema migration was the cause?** Don't auto-revert migrations — review with Brian first. Most migrations are forward-compatible; rolling the app back will work even with newer schema.

**Force-deploy reminder per CLAUDE.md feedback memo:** `vercel --prod --force` clears cache; cache restores have broken Sanity init in the past.

---

## Incident log

Template entry — copy into the table for each incident:

```
| YYYY-MM-DD HH:MM | <symptom> | <diagnosis> | <fix> | <time-to-resolve> | <follow-up> |
```

| Date | Symptom | Diagnosis | Fix | Time-to-resolve | Follow-up |
|------|---------|-----------|-----|------|-----------|
| _none yet_ | | | | | |

---

## Contact info (emergency)

Keep current. Update if anything changes.

| Provider | Channel | Notes |
|---|---|---|
| **Vercel** | Support email + dashboard support button | Pro-tier response < 24h |
| **Supabase** | https://supabase.com/dashboard/support — open ticket | Pro-tier response < 24h |
| **Anthropic** | https://support.anthropic.com — open ticket | API issues |
| **Resend** | https://resend.com/support | DNS / deliverability |
| **Sanity** | https://www.sanity.io/contact/support | Studio / webhook |
| **Domain registrar** | _to fill_ — name + URL of registrar | DNS records |
| **DNS provider** | _to fill_ — same or separate? | If you can't update DNS, you can't fix Resend issues |

---

## Out of scope for launch — tracked for post

The following are deferred. None block launch.

### P12.5 — autonomous polish pass (Opus runs after P12 is approved)

- Lighthouse audit on every page; surface scores below 95 (mobile + desktop)
- Apply low-risk perf fixes (image optimization, lazy loading)
- Accessibility audit on portal: WCAG AA, focus order, ARIA labels, contrast, keyboard nav
- Edge-case empty state audit
- Mobile/iPad regression sweep
- Copy review (any inline strings that read awkward)
- Documentation pass: README, CLAUDE.md, all session specs cross-referenced
- **Resolve the 18 React-hooks lint errors** logged in `KNOWN-GOTCHAS.md`
- **Define + ship a CSP** (deferred from P12 — needs per-route review for Tailwind / Sanity Studio / Cal.com / PostHog inline styles)

### P13 — post-launch backlog

- `is_user_certified_for_device` RPC caller-scope gate (RLS LOW finding)
- Migrate rate-limit to Redis-backed (Upstash or Vercel KV) for cross-instance coherence
- Auth endpoint app-level rate limiting (build wrapper routes around `supabase.auth.*`)
- Dead-table cleanup (`practitioners`, `treatment_logs`, `event_rsvps`)
- 7 moderate transitive npm audit findings — wait for upstream patches
- Storage backup strategy if Supabase plan doesn't natively cover Storage

---

**End of runbook. Last updated: 2026-05-05 (P12).**
