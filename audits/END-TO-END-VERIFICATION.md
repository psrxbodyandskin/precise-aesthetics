# End-to-End Verification Protocol — P12

**Purpose:** Pre-launch dry-run script. Every flow walked sequentially, observed against the live system. Pass = the row exists, the email lands, the notification fires, the audit log writes. Fail = anything else; raise to Brian.

**When to run:** T-7, T-3, T-1, and T-0 (launch morning) per `LAUNCH-RUNBOOK.md`. Each pass produces a fresh dated copy in `audits/runs/END-TO-END-<YYYY-MM-DD>.md`.

**Environment:** Production (`https://preciseaesthetics.com`), unless explicitly noted otherwise.

**Cleanup discipline:** Run the **Cleanup** section at the end of each flow before starting the next. Accumulated test rows pollute the admin dashboard and skew the agent-cost tracking. Use the SQL snippets provided.

**Roles in this doc:**

- **Operator** — Brian, running the protocol
- **Test Admin** — a real admin auth user reserved for verification (`audit-admin@preciseaesthetics.com` recommended)
- **Test Practice** — a provisioned practice account (`audit-practice@preciseaesthetics.com` recommended)
- **Test Inbox** — a mail account where Resend test emails land (Brian's, or a dedicated `audit-inbox+test@…`)

---

## How to read this document

Each flow has the same shape:

1. **Setup prerequisites** — what must exist before starting
2. **Step-by-step** — numbered, deterministic actions
3. **Expected at each step** — the success signal
4. **Inspect** — where to verify (DB query, Resend dashboard, audit log, etc.)
5. **Result boxes** — `[ ]` per step; tick `[x]` on pass, `[F]` on fail with notes
6. **Notes** — free-form per-run observations
7. **Cleanup** — SQL + UI steps to reset before the next flow

If a step fails, **stop the flow and raise.** Don't continue and accumulate cascading failures.

---

# Flow 1 — Practice provisioning + onboarding

**What this verifies:** P2 + P3 — admin can stand up a new practice from zero, invite email lands, practice user completes the 7-step setup wizard, and the account flips to `active`.

## Setup prerequisites

- Test Admin signed in at `https://preciseaesthetics.com/admin/login`
- Test Inbox accessible (email account where the invite will land)
- Use a fresh email — must NOT already exist in `auth.users`. Recommend pattern: `audit-practice-<YYYYMMDD>@preciseaesthetics.com`
- Have a test practice name + state ready (e.g., "Audit Practice — 2026-05-05")

## Step-by-step

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 1 | Admin → `/admin/practices` → "New practice" | Form renders, no console errors | `/admin/practices/new` loads cleanly | `[ ]` |
| 2 | Fill name + primary email + state, submit | Redirect to `/admin/practices/[id]`. Status chip = `pending`. | URL contains a UUID; status chip says "Pending" | `[ ]` |
| 3 | Admin clicks "Send invite" | Toast: "Invite sent." Audit log entry written. | Resend dashboard shows queued email; `audit_log` has `practice.invite` row with target_id = practice.id | `[ ]` |
| 4 | Test Inbox receives invite email | Email arrives within 60s. Sender = `RESEND_FROM_EMAIL`. Subject mentions Precise Aesthetics. Link is `https://preciseaesthetics.com/api/auth/callback?code=...&next=/portal/setup` | Open email; hover link to confirm host + path | `[ ]` |
| 5 | Click link in test inbox | Lands on `/portal/setup` (step 1: Welcome) after auth callback runs | Browser URL after redirect; no `auth_error=1` | `[ ]` |
| 6 | Step 1: Welcome → continue | Step 2 (Password) renders | Visual: "Set your password" heading | `[ ]` |
| 7 | Step 2: Set password (min length per Supabase config), submit | Step 3 (Profile) renders. Password is set in Supabase Auth. | `auth.users.encrypted_password` is non-null for the user | `[ ]` |
| 8 | Step 3: Profile (name, role) | Step 4 (Authorized users) renders | Practice user row populated in `practice_users` | `[ ]` |
| 9 | Step 4: Add at least one authorized user (yourself) | `practice_authorized_users` row created | `select * from practice_authorized_users where practice_id = '<id>'` returns ≥1 | `[ ]` |
| 10 | Step 5: Devices | Should show "Precise Pico" if assigned via admin step 2; else empty + warning copy | `practice_devices` matches | `[ ]` |
| 11 | Step 6: Brief tour (3 slides) | Each slide advances; final "Continue" enabled | UI behavior | `[ ]` |
| 12 | Step 7: Done → "Enter Portal" | Lands on `/portal` dashboard. Practice row `status` flipped from `pending` → `active`. | `select status from practices where id = '<id>'` returns `active` | `[ ]` |
| 13 | Audit log written | Status flip recorded | `select * from audit_log where target_id = '<id>' order by created_at desc` includes `practice.activate` | `[ ]` |

## Notes (per-run observations)

> _Free-form. Note timing, copy issues, anything that should feed P12.5 polish._

## Cleanup

Run as service-role in Supabase SQL editor:

```sql
-- Replace <practice_id> + <auth_user_id> with the values from this run
delete from public.practice_authorized_users where practice_id = '<practice_id>';
delete from public.practice_users where practice_id = '<practice_id>';
delete from public.practice_devices where practice_id = '<practice_id>';
delete from public.practices where id = '<practice_id>';
delete from public.audit_log where target_id = '<practice_id>';

-- Then in the Supabase Auth UI: delete the auth user
-- Dashboard → Authentication → Users → find <auth_user_id> → Delete
```

---

# Flow 2 — Training to certification

**What this verifies:** P9 + P9.1 — practice user picks their identity, watches both videos to ≥90%, marks each module complete, clicks "Complete certification," and a per-user cert row lands. Certificate page renders + prints.

## Setup prerequisites

- Active practice account from Flow 1 (or a re-used persistent one)
- Practice has at least one device assigned (e.g., Precise Pico)
- Admin has authored at least one curriculum + 2 required modules tied to that device, all `is_published = true`
- Test Admin signed out; Practice User signed in at `/portal`

## Step-by-step

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 1 | `/portal/training` | Curriculum visible; lock-icon badge if any module unwatched | Page loads; no unrelated errors | `[ ]` |
| 2 | TrainingUserPicker dropdown opens | Lists every authorized user for the practice; current user pre-selected | UI behavior; dropdown opacity solid (not see-through) | `[ ]` |
| 3 | Click into curriculum → module 1 | Module 1 video page loads at `/portal/training/modules/[moduleId]` | URL + heading | `[ ]` |
| 4 | Watch module 1 to ≥90% | Progress bar advances; "Mark complete" enables at 90% | `module_progress` row updates `watch_progress_pct` live | `[ ]` |
| 5 | Click "Mark complete" → acknowledgement | Module 1 marked complete; auto-advance to module 2 OR back to curriculum | `module_progress.is_complete = true` for module 1 | `[ ]` |
| 6 | Module 2: same as steps 3–5 | Module 2 complete | `module_progress.is_complete = true` for module 2 | `[ ]` |
| 7 | Curriculum overview shows "Complete certification" CTA | Button enabled (was disabled while modules incomplete) | Visual | `[ ]` |
| 8 | Click "Complete certification" | Toast success; redirect to certificate page | UI behavior | `[ ]` |
| 9 | `practice_certifications` row created | Status `certified`, `practice_user_id` = current user, `device_id` = correct device | `select status, practice_user_id, device_id from practice_certifications where practice_id = '<id>'` | `[ ]` |
| 10 | Certificate page renders | Practice name, user name, device, cert date, expiration, signature block | Visual | `[ ]` |
| 11 | Print preview (Ctrl+P) | Prints cleanly: no UI chrome, no broken layout | Browser print dialog preview | `[ ]` |
| 12 | RLS: another practice user (signed in to a DIFFERENT test practice) tries `/portal/certificates/<deviceId>/<thisUserId>` | 404 or empty (RLS blocks cross-practice read) | URL behavior | `[ ]` |

## Notes

> _Per-run._

## Cleanup

```sql
-- Reset the cert + progress so the next run isn't an idempotent skip
delete from public.practice_certifications where practice_id = '<practice_id>';
delete from public.module_progress where practice_id = '<practice_id>';
```

The curriculum/modules themselves stay in place — they're admin-managed shared content.

---

# Flow 3 — Treatment logging (gated)

**What this verifies:** P6 — pre-cert blocked → cert lands → treatment can be logged → photo EXIF stripped → adverse event flag fires admin notification.

## Setup prerequisites

- Practice user from Flow 2 (now certified)
- A second practice user for cert-gate test (NOT certified for the device)
- Photo file with embedded GPS EXIF (use a phone photo or `exiftool` to verify metadata exists pre-upload)

## Step-by-step

### Sub-flow 3a — Cert gate blocks uncertified user

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 1 | Sign in as the **uncertified** user → `/portal/treatments/new` | Page renders blocked state OR redirects to certification flow | UI: blocked-state copy visible; can't access form | `[ ]` |
| 2 | Try direct POST to `/api/portal/treatments` via curl/Postman with that session cookie | 403 with clear error | Response body + status | `[ ]` |

### Sub-flow 3b — Certified user completes the form

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 3 | Sign in as the **certified** user → `/portal/treatments/new` | Form renders; no blocked state | UI | `[ ]` |
| 4 | Open protocol selector | Only protocols tagged for owned + certified devices appear | Visual: list scoped, not the full library | `[ ]` |
| 5 | Pick a protocol; fill all required fields (Fitzpatrick, parameters, indication, entered_by) | Form valid, submit enabled | UI | `[ ]` |
| 6 | Upload photo (with GPS EXIF) | Client-side strips metadata via canvas re-encode before upload | Inspect network tab: uploaded blob is JPEG, smaller than original; no EXIF binary signature visible | `[ ]` |
| 7 | Toggle "Flag adverse event"; submit | Submit succeeds. Toast: "Treatment logged." | UI | `[ ]` |
| 8 | `treatments` row created | All fields present; `practice_id` = caller; `entered_by` = selected user | `select * from treatments where id = '<latest>'` | `[ ]` |
| 9 | `treatment_photos` row(s) created | One row per uploaded photo; storage path `treatments/<treatment_id>/...` | DB + storage browser | `[ ]` |
| 10 | Download the photo from Storage; run `exiftool` | NO GPS, NO datetime, NO device fields | `exiftool downloaded.jpg` shows minimal/empty metadata | `[ ]` |
| 11 | `treatment_adverse_events` row created | `practice_id` = caller; `treatment_id` = the new treatment | `select * from treatment_adverse_events where treatment_id = '<id>'` | `[ ]` |

### Sub-flow 3c — Admin notification fires

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 12 | Test Admin checks email | Adverse event email arrives within 2 min (mandatory category) | Resend dashboard + Test Inbox | `[ ]` |
| 13 | Test Admin → `/admin` notification bell | Bell shows unread; opens panel; `adverse_event.new` notification visible | UI | `[ ]` |
| 14 | `notification_dispatch_log` row | One per recipient × channel | `select * from notification_dispatch_log where event_id like 'adverse_event.new.%' order by created_at desc limit 5` | `[ ]` |

### Sub-flow 3d — Admin marks AE addressed; practice gets update notif

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 15 | Admin → `/admin/adverse-events` → click the new AE | Detail view loads; status = `new` | URL + UI | `[ ]` |
| 16 | Admin marks status `addressed` | Status chip flips; audit log entry written | UI + `select * from audit_log where target_id = '<ae_id>'` | `[ ]` |
| 17 | Practice user → `/portal/notifications` | New `adverse_event.status_updated` notification visible | UI | `[ ]` |

## Notes

> _Per-run. Note any photo upload weirdness, EXIF leak, or notification delay._

## Cleanup

```sql
-- Order matters: AE → photos → treatment → notifications
delete from public.treatment_adverse_events where treatment_id in (
  select id from public.treatments where practice_id = '<practice_id>' and treatment_date >= '<run_date>'
);
delete from public.treatment_photos where treatment_id in (
  select id from public.treatments where practice_id = '<practice_id>' and treatment_date >= '<run_date>'
);
delete from public.treatments where practice_id = '<practice_id>' and treatment_date >= '<run_date>';
delete from public.notifications where event_id like 'adverse_event.%' and created_at >= '<run_date>';
delete from public.notification_dispatch_log where event_id like 'adverse_event.%' and created_at >= '<run_date>';
delete from public.audit_log where action like 'adverse_event.%' and created_at >= '<run_date>';
```

Storage cleanup: in Supabase Storage UI, delete `treatments/<treatment_id>/` folders for the test treatments.

---

# Flow 4 — Marketing form to admin inbox

**What this verifies:** P8 + P11 — public lead/demo/contact submission → row created → admin notification fires → Lead Enricher auto-runs → admin advances status through workflow → audit log writes for each transition.

## Setup prerequisites

- Test Admin signed in at `/admin/inbox`
- Test Inbox accessible (welcome email lands here)
- Run with Anthropic API key live so Lead Enricher fires

## Step-by-step

### Sub-flow 4a — Lead form

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 1 | Open `https://preciseaesthetics.com/` (anon, incognito ok) → submit lead form | Form succeeds, success state renders | UI: success copy | `[ ]` |
| 2 | `leads` row created | `email`, `interest`, `utm_*`, `source` all populated | `select * from leads order by created_at desc limit 1` | `[ ]` |
| 3 | Welcome email lands at Test Inbox | Within 60s. Subject + body match the React Email template. | Resend dashboard + inbox | `[ ]` |
| 4 | Admin in-app notification | Bell shows unread; `inbox.new_lead` visible | UI + `notifications` row | `[ ]` |
| 5 | Lead Enricher auto-runs | `agent_runs` row created with `agent_type = 'lead_enricher'`, `trigger_type = 'auto'`, `status = 'success'` (or `failed` with logged error) | `select agent_type, trigger_type, status, cost_usd from agent_runs order by created_at desc limit 1` | `[ ]` |
| 6 | After enricher succeeds: `leads.enrichment_data` populated, `enriched_at` non-null | JSON contains practice_inferred / practitioner_inferred fields | `select enrichment_data, enriched_at from leads where id = '<id>'` | `[ ]` |
| 7 | Admin → `/admin/inbox/lead/<id>` | Detail view renders; Enrichment section shows structured data (not the placeholder) | UI | `[ ]` |
| 8 | Advance status: new → contacted | Status chip flips; audit log entry | UI + `audit_log.action = 'lead.status_change'` | `[ ]` |
| 9 | Advance to qualified → closed | Each transition writes audit | `select * from audit_log where target_id = '<lead_id>' order by created_at` | `[ ]` |

### Sub-flow 4b — Demo request

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 10 | Open `/demo` → submit form | Success state renders | UI | `[ ]` |
| 11 | `demo_requests` row created | All fields persisted; `cal_booking_id` may be present if Cal embed completes | DB row | `[ ]` |
| 12 | Admin in-app + email notification fires | Same dual-channel pattern | UI + Resend | `[ ]` |
| 13 | Lead Enricher fires for demo (model: haiku) | `agent_runs` row with `lead_type: 'demo'` in `trigger_context` | DB row | `[ ]` |
| 14 | `demo_requests.enrichment_data` populated | Same structure as lead | DB | `[ ]` |

### Sub-flow 4c — Contact message

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 15 | Open `/contact` → submit | Success state | UI | `[ ]` |
| 16 | `contact_messages` row created | Subject + body persisted | DB row | `[ ]` |
| 17 | Lead Enricher fires for contact | `agent_runs` row with `lead_type: 'contact'` in trigger_context | DB | `[ ]` |
| 18 | `contact_messages.enrichment_data` populated | (P11 added these columns to contact_messages) | DB | `[ ]` |

### Sub-flow 4d — Idempotency check

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 19 | Submit the SAME lead email a second time | Either upsert + no second enrichment run, OR new row but enricher idempotency skips | Compare `agent_runs.lead_enricher` count before/after; should not double-bill | `[ ]` |

## Notes

> _Per-run. Track cost from `agent_runs.cost_usd` for each enrichment._

## Cleanup

```sql
-- Use the date when the run started
delete from public.agent_runs where created_at >= '<run_date>' and trigger_type = 'auto';
delete from public.notification_dispatch_log where created_at >= '<run_date>';
delete from public.notifications where created_at >= '<run_date>';
delete from public.audit_log where created_at >= '<run_date>' and action like 'lead.%';
delete from public.leads where created_at >= '<run_date>' and email like 'audit-%';
delete from public.demo_requests where created_at >= '<run_date>' and email like 'audit-%';
delete from public.contact_messages where created_at >= '<run_date>' and email like 'audit-%';
```

---

# Flow 5 — Protocol publish to practitioner notification

**What this verifies:** P10 — Sanity webhook → Supabase mirror → version snapshot → notifications fan out (mandatory for prior users, mutable for device-owners).

## Setup prerequisites

- A protocol exists in Sanity with at least one Supabase mirror entry in `protocols`
- At least one practice has previously logged a treatment with this protocol (creates the "prior user" cohort)
- At least one other practice owns the protocol's device but hasn't used it (creates the "new for owned device" cohort)
- Sanity webhook configured per `spec/SANITY-WEBHOOK-SETUP.md`

## Step-by-step

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 1 | Roni edits a protocol in Sanity Studio at `/studio` | Editor loads, no errors | UI | `[ ]` |
| 2 | Roni publishes the change | Sanity confirms publish | Sanity Studio "published" indicator | `[ ]` |
| 3 | Sanity webhook fires | POST hits `/api/webhooks/sanity/protocol` with valid HMAC signature | Vercel logs show 200 response within ~10s | `[ ]` |
| 4 | `protocols` row updated | `current_version` bumped, `last_synced_at` recent | DB row | `[ ]` |
| 5 | `protocol_versions` row appended | New row with version label + snapshot, `protocol_id` matches | `select * from protocol_versions where protocol_id = '<id>' order by created_at desc limit 3` | `[ ]` |
| 6 | Practices with prior treatments: notification fires (in-app + email) | `notifications` row with category `protocol.updated_for_used_protocol`, mandatory | `select * from notifications where category = 'protocol.updated_for_used_protocol' and created_at >= '<run_date>'` | `[ ]` |
| 7 | Practices with device but no prior use: in-app only (no email) | `notifications` row category `protocol.new_for_owned_device`; `dispatch_log` shows in-app `success` and email `skipped` | `select * from notification_dispatch_log where event_id like 'protocol.%' and created_at >= '<run_date>'` | `[ ]` |
| 8 | Practitioner from cohort 1 → `/portal/protocols/<slug>` | Sees new version label | UI | `[ ]` |
| 9 | Quiet-hours interaction (extends to Flow 8): if recipient has quiet hours active, email skipped but in-app fires for mandatory; for mutable, both skipped | Verify against the recipient's `notification_preferences` | `select * from notification_preferences where practice_id = '<id>'` | `[ ]` |
| 10 | Bad signature test: replay the webhook payload with wrong secret → 400 | Server rejects | Use curl with `-H "sanity-webhook-signature: bad"` | `[ ]` |

## Notes

> _Per-run. Note webhook latency, fan-out time, any practice that should have received but didn't._

## Cleanup

```sql
-- Don't delete protocol_versions (they're append-only audit history)
-- Don't revert the protocols row update (Sanity is source of truth)
-- Just clean up the notification fan-out so the dashboard isn't polluted
delete from public.notifications where category like 'protocol.%' and created_at >= '<run_date>';
delete from public.notification_dispatch_log where event_id like 'protocol.%' and created_at >= '<run_date>';
```

If you want to revert the protocol change in Sanity, use the Studio history panel — but not necessary for cleanup; the verification value is the fan-out, not the content.

---

# Flow 6 — AI agent execution

**What this verifies:** P11 — admin clicks an inline trigger → agent runs → row recorded in `agent_runs` → markdown output renders → replay creates a linked second row → cost dashboard sums.

## Setup prerequisites

- Test Admin signed in
- `ANTHROPIC_API_KEY` live in Vercel env (verified in Phase D)
- At least one treatment + one adverse event exists in DB so Pattern Analyst has data
- Note: agent endpoints are now rate-limited at 20/admin/hour — don't burn the budget early

## Step-by-step

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 1 | Admin → `/admin/dashboard` | Dashboard renders; "Analyze patterns in this period" button visible (treatment data exists) | UI | `[ ]` |
| 2 | Click button | Spinner appears; ~10–30s wait | UI | `[ ]` |
| 3 | Result panel renders | Markdown analysis below the button; cost + latency in footer | UI | `[ ]` |
| 4 | `agent_runs` row created | `agent_type = 'pattern_analyst'`, `model = 'claude-sonnet-4-5'`, `status = 'success'`, `cost_usd > 0`, `parsed_output` non-null | `select agent_type, model, status, cost_usd, latency_ms from agent_runs order by created_at desc limit 1` | `[ ]` |
| 5 | `triggered_by_user_id` matches admin auth user | Audit trail correct | DB | `[ ]` |
| 6 | Navigate to `/admin/ai/runs` | List shows the new run with status chip + cost | UI | `[ ]` |
| 7 | Click into `/admin/ai/runs/[id]` | Detail page renders: status, model, cost, latency, system prompt (collapsed), user message (open), output (markdown), trigger context | UI | `[ ]` |
| 8 | Click "Replay" | New `agent_runs` row created with `replay_of_id = <original.id>`; UI shows new result | DB + UI | `[ ]` |
| 9 | `/admin/ai/cost?range=30d` | KPIs reflect both runs; "Cost by agent" chart shows pattern_analyst bar | UI | `[ ]` |
| 10 | Rate-limit gate: hammer the same agent endpoint 21+ times in an hour (use Postman/curl with admin cookie) | 21st attempt returns 429 with `Retry-After` header | Response status + body | `[ ]` |

## Notes

> _Per-run. Track total cost from `agent_runs.cost_usd` summed for the run._

## Cleanup

```sql
-- Don't blow away ALL agent_runs — that's audit history. Just the test runs.
delete from public.agent_runs
  where triggered_by_user_id = '<test_admin_uuid>'
    and created_at >= '<run_date>'
    and trigger_type = 'manual';
```

If the rate-limit test pushed the bucket high, just wait an hour for the in-memory bucket to expire (or restart the dev server in non-prod).

---

# Flow 7 — Query Assistant SQL safety

**What this verifies:** P11 — Query Assistant runs three Anthropic passes; the layered safety net (regex parser + READ ONLY tx + 10s statement timeout + `is_admin()` gate) blocks every write attempt and prohibited schema reference.

## Setup prerequisites

- Test Admin signed in at `/admin/ai/query`
- Some real-ish data in `treatments` so the legitimate query has rows to return

## Step-by-step

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 1 | Ask: "How many treatments were logged in the last 30 days?" | SQL generates → validates → executes → renders an explanation + count | UI: number is plausible; agent_runs has 1 success row | `[ ]` |
| 2 | `agent_runs` for query_assistant has `parsed_output` with the SQL + result | Multi-pass chain visible in trigger_context (or rows linked via replay_of_id) | DB | `[ ]` |
| 3 | Ask: "Update all treatments to Fitzpatrick 6" | Blocked at regex layer with clear error message ("write operations are not allowed" or similar). NO `agent_runs` row reaches Anthropic execution; OR a row lands with `status='failed'` and `error_message` mentioning the block. | UI: error displayed; DB: confirm no actual UPDATE ran (`select count(*) from treatments where patient_fitzpatrick = 'VI'` unchanged) | `[ ]` |
| 4 | Ask: "Show me data from auth.users" | Blocked at regex layer (auth.* schema reference rejected) | UI error | `[ ]` |
| 5 | Ask: "Show me data from storage.objects" | Blocked at regex layer (storage.* rejected) | UI error | `[ ]` |
| 6 | Ask a query that COULD pass regex but the RPC would block (e.g., trick wording that produces an UPDATE in the model output) | Postgres RPC level blocks via `SET LOCAL default_transaction_read_only = on` → 25006 read_only_sql_transaction error | `agent_runs.error_message` contains 25006 or "read-only transaction" | `[ ]` |
| 7 | Ask a query that would scan a huge table (e.g., joins across all treatments × treatment_photos × notifications) | Either succeeds within 10s OR fails with statement_timeout. **Must NOT pin connection past 10s.** | Watch latency_ms; should be ≤10000 even on timeout | `[ ]` |
| 8 | Sign out, sign in as a non-admin (practice user). Try POST to `/api/admin/ai/query-assistant` directly | 403 (route requireAdmin gate) — second line of defense | curl response status | `[ ]` |

## Notes

> _Per-run. Note any clever phrasing that gets through regex; flag for prompt-engineering review._

## Cleanup

```sql
-- The query test runs DO incur cost (each is one Anthropic 3-pass call).
-- Tag them as test by restricting the cleanup window:
delete from public.agent_runs
  where agent_type = 'query_assistant'
    and triggered_by_user_id = '<test_admin_uuid>'
    and created_at >= '<run_date>';
```

---

# Flow 8 — Notification preferences + quiet hours

**What this verifies:** P10 — admin sets quiet hours, mandatory categories override quiet hours for email, mutable categories obey both quiet hours and explicit mute.

## Setup prerequisites

- Test Admin with notification preferences accessible at `/admin/settings/notifications` (or wherever P10 placed it)
- Test Practice user with their own preferences page
- Server time aware: pick a time of day where you can deliberately set quiet hours covering "now"

## Step-by-step

### Sub-flow 8a — Quiet hours block mutable email but allow mandatory

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 1 | Admin sets quiet hours covering "now" (e.g., 22:00–07:00 if it's 23:00 local). Save. | `notification_preferences.quiet_hours_*` columns persist; UI shows current hours active | DB row + UI | `[ ]` |
| 2 | Submit a public lead form (mutable category `inbox.new_lead`) | In-app notification fires; **email skipped** with reason `quiet_hours` in dispatch log | `select channel, status, skip_reason from notification_dispatch_log where event_id = 'inbox.new_lead.<id>'` | `[ ]` |
| 3 | Submit an adverse event (mandatory category `adverse_event.new`) | In-app fires; **email also fires** despite quiet hours (mandatory override) | `notification_dispatch_log` shows `success` for both channels | `[ ]` |

### Sub-flow 8b — Mute a mutable category

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 4 | Admin toggles `inbox.new_lead` to muted (in-app off) and email off | Preferences row updates | DB | `[ ]` |
| 5 | Submit another public lead form | Neither in-app nor email; no `notifications` row for that category for that admin; dispatch log shows `skipped: muted` | `notifications` count for category unchanged; dispatch log shows skip | `[ ]` |
| 6 | Admin un-mutes | Toggle back on, save | DB | `[ ]` |
| 7 | Submit another lead | Both channels fire (assuming we're now outside quiet hours, or quiet hours cleared) | UI + DB | `[ ]` |

### Sub-flow 8c — Mandatory categories cannot be muted

| # | Action | Expected | Inspect | Result |
|---|--------|----------|---------|--------|
| 8 | Try to toggle `adverse_event.new` to muted in the preferences UI | UI either disallows the toggle (greyed out) OR allows the toggle but server-side ignores | Inspect: what's the live behavior; document it | `[ ]` |
| 9 | If the UI lets you mute it, submit an adverse event | Email STILL fires (mandatory backstop in dispatcher) | `dispatch_log` confirms send | `[ ]` |

## Notes

> _Per-run. Quiet hours timezone behavior is critical — note any DST/timezone weirdness._

## Cleanup

```sql
-- Restore admin notification prefs to defaults
update public.notification_preferences
  set quiet_hours_start = null, quiet_hours_end = null,
      muted_categories = '{}'::text[]
  where practice_id is null and admin_user_id = '<test_admin_uuid>';

-- Clean up the test-fired notifications + dispatch entries
delete from public.notifications where created_at >= '<run_date>';
delete from public.notification_dispatch_log where created_at >= '<run_date>';
delete from public.leads where created_at >= '<run_date>' and email like 'audit-%';
```

---

# Cross-flow cleanup (after all 8 flows pass)

Final reset before signing the run as complete:

```sql
-- 1. Verify nothing test-tagged remains
select count(*) from public.leads where email like 'audit-%';
select count(*) from public.demo_requests where email like 'audit-%';
select count(*) from public.contact_messages where email like 'audit-%';
select count(*) from public.agent_runs where created_at >= '<protocol_start_date>';
select count(*) from public.audit_log where created_at >= '<protocol_start_date>';
-- All should be 0 (or low, with explainable persistent rows like protocol_versions)

-- 2. Confirm dashboard isn't polluted
select count(*) from public.treatments where created_at >= '<protocol_start_date>';
-- Should be 0 if you cleaned per-flow

-- 3. Spot-check storage
-- Storage UI → treatments/ — no folders dated within the protocol window
```

If any count is non-zero and unexplained, **do not sign off** — track down the residue and clean before declaring the run pass.

---

# Test-data candidates surfaced during P12 audit (per concern #6)

The following rows were observed in production during the P12 static audit. They are flagged here so Roni + Brian can review and clean before launch. **Do not auto-delete.**

> _To be filled in during the first dry-run by querying:_
>
> ```sql
> select id, email, created_at from public.leads
>   where email like '%test%' or email like '%example%' order by created_at desc;
> select id, email, created_at from public.demo_requests
>   where email like '%test%' or email like '%example%' order by created_at desc;
> select id, name, primary_email, status from public.practices
>   where name ilike '%test%' or primary_email like '%test%';
> select id, agent_type, created_at from public.agent_runs
>   where created_at < now() - interval '30 days';  -- pre-launch test runs
> ```
>
> _Paste row IDs here for manual review with Roni:_

| Table | ID | Identifier | Created | Disposition (after Brian + Roni review) |
|-------|-----|-----------|---------|------------------------------------------|
| _to fill_ | _to fill_ | _to fill_ | _to fill_ | _keep / delete / archive_ |

---

# Sign-off

| Run date | Operator | All 8 flows pass? | Cleanup complete? | Initials |
|----------|----------|-------------------|-------------------|----------|
| | | `[ ]` | `[ ]` | |
| | | `[ ]` | `[ ]` | |
| | | `[ ]` | `[ ]` | |
| | | `[ ]` | `[ ]` | |

**Required passes before launch:** ≥1 full pass at T-7, ≥1 at T-3, ≥1 at T-1, ≥1 morning of T-0.

If any single flow fails on T-0, **do not launch** until it's diagnosed and re-passed.
