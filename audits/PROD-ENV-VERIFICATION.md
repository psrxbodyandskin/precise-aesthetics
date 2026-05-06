# Production Environment Verification — P12

**Date:** 2026-05-05
**Method:** `vercel env ls production` + spec-required checklist + cross-reference against actual code usage.
**Author:** P12 hardening pass.

---

## 1. Vercel environment variables (production)

Inventoried via `vercel env ls production` against `psrxbodyandskins-projects/precise-aesthetics`. Values not retrieved (encrypted at rest, redacted by CLI) — names and presence verified.

### Required vs. set

| Var | Required by | Set in prod | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Auth + DB | ✓ | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth (client) | ✓ | |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only DB writes | ✓ | |
| `NEXT_PUBLIC_SITE_URL` | OG, redirects | ✓ | Confirmed alias: `https://preciseaesthetics.com` |
| `RESEND_API_KEY` | Email transport | ✓ | |
| `RESEND_FROM_EMAIL` | Sender identity | ✓ | Operator must verify the value matches a verified sender in Resend |
| `RESEND_INTERNAL_NOTIFY_EMAIL` | Admin notifications | ✓ | |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity client | ✓ | |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity client | ✓ | |
| `SANITY_API_READ_TOKEN` | Sanity server fetch | ✓ | **Note:** spec lists this as `SANITY_API_TOKEN` (typo in spec). Code uses `SANITY_API_READ_TOKEN` — see `lib/sanity/client.ts:12`. Resolved by treating the code name as canonical. |
| `SANITY_WEBHOOK_SECRET` | Webhook HMAC verify | ✓ | |
| `SANITY_REVALIDATE_SECRET` | `/api/revalidate` shared secret | ✓ | (Not in spec list but legitimately required) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Analytics | ✓ | |
| `NEXT_PUBLIC_POSTHOG_HOST` | Analytics | ✓ | |
| `NEXT_PUBLIC_CAL_LINK` | Cal.com embed | ✓ | (Not in spec list but used on `/demo`) |
| `ANTHROPIC_API_KEY` | AI agents | ✓ | Added during P11. **Reminder: rotate** — current key was pasted in conversation transcript. |
| `SENTRY_DSN` | Error monitoring | ✗ | Pending Phase E (Sentry wiring). Will be added in that phase. |

**Verdict:** All required vars set except `SENTRY_DSN` (intentional — added in Phase E). No drift.

### Spec-vs-reality reconciliation

- **Spec lists `SANITY_API_TOKEN`; code uses `SANITY_API_READ_TOKEN`.** Cross-check: `lib/sanity/client.ts` and `.env.example` both use the read-token name. Spec was wrong; code is the truth. **No fix required**, just note in the doc.
- **Two extra vars present** (`SANITY_REVALIDATE_SECRET`, `NEXT_PUBLIC_CAL_LINK`) — both legitimately used by code, just absent from the spec checklist.

---

## 2. Operator-side dashboard checks (NOT verifiable from CLI)

These can only be confirmed in the relevant provider's dashboard. **Operator checklist** — Brian to walk before launch:

### Supabase Auth configuration

Open Supabase Dashboard → Authentication → URL Configuration:

| Setting | Required value | Operator confirms |
|---|---|---|
| Site URL | `https://preciseaesthetics.com` | `[ ]` |
| Additional Redirect URLs | `http://localhost:3457` (for dev) and `https://*.preciseaesthetics.com` (for preview deploys, optional) | `[ ]` |

**Why this matters (CLAUDE.md known gotcha):** Site URL silently overrides any `redirect_to` we pass to `generateLink()` or `resetPasswordForEmail()`. If this is wrong, invite/reset emails will redirect to the wrong domain. Cost ~30 min to diagnose during P1.

### Supabase database backups

Supabase Dashboard → Database → Backups:

| Setting | Required for clinical software at launch | Operator confirms |
|---|---|---|
| Project plan | At least Pro tier (Free tier offers PITR but no daily snapshots) | `[ ]` |
| Daily backups enabled | yes | `[ ]` |
| Retention | ≥ 7 days | `[ ]` |
| Point-in-time recovery | enabled | `[ ]` |

**Recovery procedure documentation** (operator: paste link or steps once verified):

> _To fill in after confirming backup setup. Should reference the Supabase docs at https://supabase.com/docs/guides/platform/backups and capture the actual restore command sequence for our project._

### Resend domain

Resend Dashboard → Domains:

| Setting | Required | Operator confirms |
|---|---|---|
| `preciseaesthetics.com` listed | yes | `[ ]` |
| Status: Verified | yes (green checkmark) | `[ ]` |
| SPF record at registrar | matches Resend's TXT | `[ ]` |
| DKIM records (3 CNAME) at registrar | match | `[ ]` |
| Return-Path / MAIL FROM | configured | `[ ]` |

**Test send per template before launch** — run one of each:

| Template | Trigger to test | Operator confirms delivered |
|---|---|---|
| Lead welcome | Submit form at `/` | `[ ]` |
| Internal lead notify | (same submission) | `[ ]` |
| Demo request confirm | Submit form at `/demo` | `[ ]` |
| Practice invite | Provision a test practice | `[ ]` |
| Password reset | Trigger from `/portal/login` reset link | `[ ]` |
| Adverse event admin notify | Log treatment with AE flag | `[ ]` |
| Notification digest | (P10 — depends on impl) | `[ ]` |

### Sanity webhook

Sanity → Studio → API → Webhooks (or `sanity.io/manage` → project → API):

| Setting | Required | Operator confirms |
|---|---|---|
| Webhook URL | `https://preciseaesthetics.com/api/webhooks/sanity/protocol` | `[ ]` |
| Trigger: on document publish | yes (filter on `_type == "protocol"`) | `[ ]` |
| HTTP method | POST | `[ ]` |
| Secret matches `SANITY_WEBHOOK_SECRET` in Vercel | yes | `[ ]` |
| Test fire from dashboard | 200 response from Vercel | `[ ]` |

Reference: `spec/SANITY-WEBHOOK-SETUP.md`.

### Vercel project hygiene

Vercel Dashboard → Settings:

| Setting | Required | Operator confirms |
|---|---|---|
| Production branch = `master` | yes | `[ ]` |
| Domain: `preciseaesthetics.com` aliased to production deploy | yes | `[ ]` |
| Function regions reasonable for US clinical users | default `iad1` is fine | `[ ]` |
| HSTS not separately stripped at edge | (we send HSTS header from Next config; Vercel doesn't strip) | `[ ]` |

### Anthropic console

Anthropic Console → API Keys:

| Setting | Required | Operator confirms |
|---|---|---|
| Production key labeled `Precise Aesthetics — Production` exists | yes | `[ ]` |
| Old key pasted-in-transcript REVOKED + replaced | yes — security hygiene | `[ ]` |
| Spend limit set on the account | recommended; cap at e.g. $200/month with email alert at 80% | `[ ]` |

---

## 3. CLI-verified findings

| Finding | Severity | Status |
|---|---|---|
| All required env vars present in Vercel production | n/a | PASS |
| `SENTRY_DSN` missing | n/a | EXPECTED — Phase E pending |
| Spec-vs-code env name discrepancy (`SANITY_API_TOKEN` vs `SANITY_API_READ_TOKEN`) | low | DOCUMENTED — code is truth |

---

## 4. What changed during Phase D

- Created this document.
- No env var modifications.
- No code changes.

---

## 5. Pre-delivery checklist (Phase D)

- [x] Vercel env list inventoried
- [x] Each required var cross-checked against spec
- [x] Spec-vs-code naming discrepancy resolved (`SANITY_API_READ_TOKEN`)
- [x] Operator checklist drafted for Supabase / Resend / Sanity / Vercel / Anthropic
- [x] Backup verification table (Phase F will populate)
- [x] Sentry deferred cleanly to Phase E (env var slot reserved)

**Phase D status: COMPLETE on the CLI-verifiable side. Operator-side dashboard items have unchecked boxes that Brian fills during the dry-run rituals (T-7 / T-3 / T-1 / T-0).**

Cleared to proceed to Phase E (Sentry).
