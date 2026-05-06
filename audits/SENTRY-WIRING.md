# Sentry Wiring — P12 Phase E

**Date:** 2026-05-05
**SDK:** `@sentry/nextjs@10.51.0`
**Status:** Code wired. Awaiting operator-side: Sentry project creation + `SENTRY_DSN` provisioning.

---

## What landed in code

### Files created

| File | Purpose |
|---|---|
| `sentry.client.config.ts` | Browser-side init. Replays disabled (HIPAA posture). Disabled gracefully if DSN missing. |
| `sentry.server.config.ts` | Node.js runtime init. `sendDefaultPii: false`. |
| `sentry.edge.config.ts` | Edge runtime (middleware, edge routes). |
| `instrumentation.ts` | Next.js boot hook — registers the right config per `NEXT_RUNTIME`. Re-exports `captureRequestError` as `onRequestError` for server-component error capture. |
| `app/global-error.tsx` | Global React error boundary — calls `Sentry.captureException()` and renders an editorial recovery UI in brand tokens. |
| `app/api/admin/sentry-test/route.ts` | Admin-gated synthetic-error endpoint for verification. Visit while signed in → expect a `PA_SENTRY_VERIFICATION_PROBE` issue in Sentry. |

### Files modified

| File | Change |
|---|---|
| `next.config.ts` | Wrapped export with `withSentryConfig()`. Source-map upload runs at build when `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` are set; falls back silently when missing so non-Sentry builds still pass. |

### Build verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | EXIT 0 ✓ |
| `npx next build` | EXIT 0 ✓ |
| Behaviour without DSN | All Sentry init blocks `if (dsn) {…}`; SDK is dormant. No runtime errors, no console noise. |

---

## HIPAA posture (clinical-software discipline)

Settings chosen deliberately to keep PHI out of error tracking:

- `sendDefaultPii: false` (server, edge, client) — Sentry's default PII redaction stays on
- `replaysSessionSampleRate: 0.0` — session replays OFF (could capture form input with patient context)
- `replaysOnErrorSampleRate: 0.0` — error replays OFF (same reason)
- `tracesSampleRate: 0.1` — performance tracing at 10% (no payload capture by default at this rate)

If you ever enable replays, P12.5 must add custom redaction rules and a HIPAA review pass on the Sentry data-residency setting.

---

## Operator handoff (4 steps for Brian)

### 1. Create Sentry project

- Sign in at https://sentry.io
- Create org (if not exists) → label `precise-aesthetics` or similar
- Create project → platform `Next.js` → name `precise-aesthetics-prod`
- Capture: **DSN**, **Org slug**, **Project slug**

### 2. Generate Sentry auth token (for source-map upload)

- Sentry → Settings → Auth Tokens → Create new token
- Scopes needed: `project:releases`, `project:write`, `org:read`
- Capture: **token**

### 3. Add 4 env vars to Vercel production

```
vercel env add SENTRY_DSN production
# paste DSN — make it ALSO available as NEXT_PUBLIC_SENTRY_DSN if you want
# the browser SDK to capture client-side errors:
vercel env add NEXT_PUBLIC_SENTRY_DSN production
# paste same DSN

vercel env add SENTRY_ORG production
# paste org slug

vercel env add SENTRY_PROJECT production
# paste project slug

vercel env add SENTRY_AUTH_TOKEN production
# paste auth token
```

Optionally also add to `Preview` environments so preview deploys also report (recommended).

### 4. Verify

- Trigger a fresh Vercel deploy (`vercel --prod --force` or push a commit)
- During the build, source-maps upload should run silently (you'll see a Sentry CLI block in the build log)
- Visit `https://preciseaesthetics.com/api/admin/sentry-test` while signed in as admin
- Within ~30 seconds, a Sentry issue named `PA_SENTRY_VERIFICATION_PROBE` should appear in the project
- Stack trace should be **symbolicated** (real file paths and line numbers, not minified)

If the issue doesn't appear: re-check `SENTRY_DSN` value in Vercel env, confirm the deploy completed, check Sentry org/project slug match.

---

## Alerting (operator configures in Sentry UI)

Recommended alerts to set up after first event lands:

| Alert | Condition | Channel |
|---|---|---|
| New error type | First seen in 24h | Email Brian |
| Error rate spike | Errors per minute >5x baseline | Email Brian |
| Critical category | Issue tagged `critical` | Email Brian + Slack if connected |
| Adverse event capture failure | Error in `/api/admin/adverse-events/*` | Email Brian (clinical-incident path) |

---

## What changed during Phase E

- 6 new files (configs, instrumentation, global error, test route)
- `next.config.ts` modified (Sentry wrapping)
- `package.json` + lockfile updated (`@sentry/nextjs@10.51.0` added)
- No migrations
- No env vars added in P12 — Brian provisions in operator handoff

---

## Pre-delivery checklist (Phase E)

- [x] Sentry SDK installed (`@sentry/nextjs@10.51.0`, peer-dep clean with Next 16)
- [x] Three runtime configs (client / server / edge) with HIPAA-safe defaults
- [x] `instrumentation.ts` boots the right config per runtime
- [x] `app/global-error.tsx` renders + reports
- [x] `next.config.ts` wrapped with `withSentryConfig`
- [x] Test endpoint at `/api/admin/sentry-test` (admin-gated)
- [x] Typecheck + build green with SDK installed but DSN absent (graceful no-op)
- [x] Operator handoff documented (4 steps)
- [x] HIPAA posture documented
- [ ] **(operator)** Sentry project + DSN + tokens provisioned
- [ ] **(operator)** Vercel env vars set
- [ ] **(operator)** First test event captured in Sentry dashboard
- [ ] **(operator)** Alert rules configured

**Phase E status: COMPLETE on the code side. Operator unticked items are tracked in `LAUNCH-RUNBOOK.md` Pre-launch (T-7) checklist.**

Cleared to proceed to Phase F (backup verification).
