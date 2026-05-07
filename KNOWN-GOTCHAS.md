# Known Gotchas

> Consolidated landmines reference. Mostly inherited from CLAUDE.md "Known Gotchas" + new findings during P12 hardening. Update when something bites.

---

## Auth + Supabase

### `app_metadata` is the only trustworthy auth claim — never `user_metadata`

Locked Session P1.

`user_metadata` is user-editable through Supabase's standard `auth.updateUser()` endpoint. Storing `role` there means any authenticated user can promote themselves to admin via `auth.updateUser({ data: { role: "admin" } })`.

`app_metadata` is only writable via the service-role key. Use service-role to set claims during provisioning:

```ts
await getServiceClient().auth.admin.updateUserById(userId, {
  app_metadata: { role: "practice", practice_id: newPracticeId },
});
```

Canonical claims: `app_metadata.role: "practice" | "admin"`, `app_metadata.practice_id: uuid`.

Helpers in `lib/auth/server.ts`: `getCurrentUser`, `requirePractice`, `requireAdmin`. SQL helpers in `0004_rls_framework.sql`: `auth_role()`, `is_admin()`, `current_practice_id()`.

### Supabase Auth Site URL silently overrides `redirect_to`

Locked Session P1 / P2.

Supabase project's **Site URL** setting (Dashboard → Authentication → URL Configuration → Site URL) is used as the default base for all auth-flow redirects. Any `redirect_to` we pass to `generateLink()` or `resetPasswordForEmail()` is **silently overridden** if Site URL points elsewhere.

**Production-correct setting:**
- Site URL: `https://preciseaesthetics.com`
- Additional Redirect URLs: `http://localhost:3457` (dev)

Discovered when generated links came back with `redirect_to: "http://localhost:3000"` despite explicit prod URL in the API call. Cost ~30 min to diagnose.

**No env var or migration controls this — dashboard only.** If invite/reset emails are landing wrong, check this first.

### `audit_log` types backfilled in P2

Closed loop. P1's `0004_rls_framework.sql` added `audit_log` table without types. P2 backfilled `Database["public"]["Tables"]["audit_log"]["Row"]` and the `Functions` block (`log_audit`, `auth_role`, `is_admin`, `is_practice`, `current_practice_id`). Future sessions can use these directly.

---

## Database

### Tailwind v4 ↔ shadcn token mismatch

Discovered Session 4. shadcn primitives use `bg-popover`, `bg-card`, `bg-accent`, etc., which in Tailwind v4 resolve from `--color-popover` etc. Our `globals.css` defines `--popover` / `--card` / `--accent` but **not** the `--color-*` aliases Tailwind v4 expects → those utilities render transparent.

**Workaround in shipped code:** every shadcn floating component (Dialog, Select, Sheet, Popover, etc.) gets explicit brand classes (`bg-bone-50`, `text-ink-900`, etc.) instead of relying on the bg-popover default.

**Permanent fix candidate (P12.5):** add `--color-popover: var(--popover)` aliases in `globals.css` for `card`, `accent`, `muted`, `secondary`, `destructive`, `primary`, `border`, `input`, `ring`, `foreground`, `background`. Restores shadcn defaults across the board.

### `brand-500` on light backgrounds fails WCAG AA

Computed contrast on bone-100 is 3.11:1 — fails the 4.5:1 standard for normal text. Discovered Session 4. Fix already shipped for the eyebrow (uses `brand-700` now per MASTER.md "Color Pairings").

**Audit before launch (P12.5):** every `<a>` or non-large CTA in `brand-500` on bone/cream/champagne. Either bump to `brand-700` (~8:1) or `ink-700` (~14:1). Large-text CTAs (≥18pt or ≥14pt bold) only need 3:1 — verify per-instance, don't blanket replace.

### Stale `.next/` cache produces fake errors

Discovered multiple times in P9–P11. Errors like "Link is not defined" or "cert is not defined" appearing in dev server output even though the source code is correct.

**First check on weird symptoms:** `rm -rf .next/` then restart `npm run dev`.

### Migrations are HELD by default per CLAUDE.md DB safety

Every migration produced by a session is held for manual review before applying. Never auto-apply. Never use `--force-reset` or `--accept-data-loss`. Use `prisma db push` only (no flags) for dev schema changes; `prisma migrate deploy` for prod (already in build command).

If `prisma db push` fails, **STOP** and report — don't try to force it.

### Dead tables from pre-portal era

Three tables exist in production from the original schema (`0001_initial_schema.sql`) but are unused by current code. Leave alone until P13 destructive cleanup with explicit review:

- `practitioners` — replaced by `practices` + `practice_authorized_users` in P2
- `treatment_logs` — replaced by `treatments` in P6 (entirely different schema)
- `event_rsvps` — RLS-locked-down, no API route ever shipped

RLS on `event_rsvps` has zero policies — full lockout. Acceptable for unused table.

---

## Frontend

### Stale `.next/` cache (cross-ref)

See "Database" section above.

### shadcn floating component bg (cross-ref)

See "Database" section. The bg-popover transparency bug bites every Dialog, Sheet, Select, Tooltip, DropdownMenu, Popover, HoverCard, Menubar, ContextMenu, Command. Force solid `bg-bone-50` per-component until the globals.css alias fix lands.

### EXIF stripping is client-side only

`lib/portal/photos.ts` re-encodes uploaded photos via `<canvas>` before they leave the browser. Strips ALL metadata (EXIF, IPTC, XMP). HEIC/HEIF converted via lazy-loaded `heic2any`.

If a future change uploads photos via a different path (server-side intake, automated import), it must replicate the strip. The DB doesn't enforce this — application-layer responsibility.

### Reduced motion

`prefers-reduced-motion` respected throughout. No scroll animations. Animations only on hero + intentional moments. P12.5 polish should re-verify per page.

---

## Performance + accessibility (P12.5 punch list)

### 18 React-hooks strict-rule violations (eslint-plugin-react-hooks 7) — DEFERRED TO P15+

Came in with the Next 16 / eslint-config-next 16 upgrade in P12. Production runtime unaffected — React Compiler is opt-in experimental, not enabled. Build / typecheck unaffected. Build is not gated on eslint (Next 16 doesn't auto-lint at build).

**P12.5 decision:** **deferred, not papered over.** The errors stay as errors at the eslint config level. We deliberately did NOT downgrade to warn or apply per-line disables — that would obscure the work owed.

**Why deferred (not refactored now):** these are Compiler-prep flags on patterns that work correctly today. Refactoring blind risks regressing real behavior. Per category:

**Category A — `set-state-in-effect` (11 instances):** lazy-fetch-on-open, video-progress sync, animation start. Refactor would restructure components in ways that change render timing. Without React Compiler enabled to validate the result, "fix" can introduce subtle race conditions. When Compiler enablement is the actual goal, each refactor gets validated by Compiler immediately. Doing them now is blind.

**Category B — `purity` (3 instances):** `PracticeTrainingProgressPanel.tsx:38` uses `Date.now()` to evaluate cert-expiry status. Replacing with a `useRef`-stable value would break the live display when admins keep the page open past expiry. The current behavior is **correct**; the rule is being overly strict. `CurriculumOverviewCard.tsx:61` and `ModulesProgressList.tsx:49` are similar. Refactor would require switching from "render-time computation" to "interval-driven re-render" — more code for the same semantic.

**Category C — `immutability` (4 instances):** `FlowArrow.tsx:252,259,264` is 3D animation closure mutation in react-three-fiber — the mutation pattern is documented r3f idiom for animating ref-attached objects. `TreatmentsFilterBar.tsx:78,96` is function-declared-after-use (JS hoisting handles it; lint rule doesn't trust it). The r3f animation refactor in particular needs careful thought about animation loop semantics.

**Resolution:** P15+, alongside React Compiler enablement.

| # | File | Line | Rule |
|---|------|------|------|
| 1 | `components/admin/training/AddModulePicker.tsx` | 44:5 | setState in effect |
| 2 | `components/admin/training/PracticeTrainingProgressPanel.tsx` | 38:60 | impure render |
| 3 | `components/marketing/CountUpStat.tsx` | 41:7 | setState in effect |
| 4 | `components/marketing/Header.tsx` | 79:58 | setState in effect |
| 5 | `components/marketing/hero-3d/ConvergenceHero.tsx` | 28:5 | setState in effect |
| 6 | `components/marketing/hero-3d/components/FlowArrow.tsx` | 252:12 | local mutation post-render |
| 7 | `components/marketing/hero-3d/components/FlowArrow.tsx` | 259:5 | value cannot be modified |
| 8 | `components/marketing/hero-3d/components/FlowArrow.tsx` | 264:5 | value cannot be modified |
| 9 | `components/marketing/sections/SinglePillarScene.tsx` | 126:5 | setState in effect |
| 10 | `components/portal/training/CurriculaOverviewClient.tsx` | 39:7 | setState in effect |
| 11 | `components/portal/training/CurriculumModulesClient.tsx` | 36:7 | setState in effect |
| 12 | `components/portal/training/CurriculumOverviewCard.tsx` | 61:54 | impure render |
| 13 | `components/portal/training/ModulePlayerClient.tsx` | 56:7 | setState in effect |
| 14 | `components/portal/training/ModulePlayerClient.tsx` | 83:5 | setState in effect |
| 15 | `components/portal/training/ModulesProgressList.tsx` | 49:49 | impure render |
| 16 | `components/portal/treatments/TreatmentLogForm.tsx` | 159:7 | setState in effect |
| 17 | `components/portal/treatments/TreatmentsFilterBar.tsx` | 78:32 | access before declared |
| 18 | `components/portal/treatments/TreatmentsFilterBar.tsx` | 96:3 | (paired with 78:32) |

### CSP — REPORT-ONLY shipped in P12.5; enforcement pending operator browser verification

P12 shipped X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy. P12.5 added a Content Security Policy in **report-only** mode (`Content-Security-Policy-Report-Only` header in `next.config.ts`). Operator's job: walk every public + portal + admin route + `/studio` after deploy, capture browser-console violation reports, file any required allowlist additions, then flip header name to `Content-Security-Policy` to enforce. Tracked as P12.5.5.

Accepted policy gaps documented inline in `next.config.ts`:
- `'unsafe-inline'` for `style-src` — Tailwind v4 + shadcn primitives emit inline styles. Modernizing to nonce-based style would require touching every styled primitive (P15+).
- `'unsafe-eval'` for `script-src` — Sanity Studio's vite-style runtime evaluates schemas at boot. Scoped to surface in violations; can be tightened post-Studio testing.

### Lighthouse target 95+ — STATIC-AUDIT IN P12.5; OPERATOR RUN PENDING

Per CLAUDE.md. P12.5 applied static perf review (verified Next/Image usage, font-display: swap via next/font/google with `display: "swap"`). **Cannot run Lighthouse from CI/agent context.** Operator should run Lighthouse against production preview URLs for the routes listed in `spec/SESSION-P12-5-POLISH.md` § Phase 3 and document scores in `P12.5-POLISH-RESULTS.md`. Targets: 95+ on public routes, 90+ on portal, 85+ on admin.

### Shadcn `bg-popover` token mismatch — RESOLVED IN P12.5

`globals.css` now defines `--color-popover` and 14 other shadcn token aliases mapping to brand primitives (bone-100 / ink-900 / etc.). Per-component `bg-bone-50` overrides on Dialog / Select / Sheet / DropdownMenu wrappers are now redundant but left in place for resilience — removing them is a P15+ cleanup, not a polish-session task.

### `brand-500` text contrast on light backgrounds — RESOLVED IN P12.5

Audit results:
- `components/marketing/typography/Eyebrow.tsx:18` — `tone="ink"` was `text-brand-500` on bone (3.11:1, fails AA). Bumped to `text-brand-700` (~8:1).
- `app/(marketing)/pico/page.tsx:439, 792` — link hover state `hover:text-brand-500` reversed contrast on hover. Changed to `hover:text-ink-900` (deeper on hover, stronger contrast).
- `components/marketing/system/StructuredGrid.tsx:201` — `text-brand-500` on `<Icon aria-hidden="true">` (non-text). WCAG AA text contrast doesn't apply; non-text component contrast (1.4.11) requires 3:1 — brand-500 on bone is 3.11:1, just clears. Acceptable.
- `components/marketing/sections/Outcomes.tsx:94` — same (icon, non-text). Acceptable.
- `TreatmentLogForm.tsx`, `PhotoUploader.tsx` — `text-brand-500` on checkbox check-mark color. Component-level, non-text. Acceptable.

---

## Operations

### `vercel --prod --force` after every push to precise-aesthetics

Per `feedback_force_deploy_precise_aesthetics.md`. Cache restores have broken Sanity init. Always force.

```bash
git push           # → triggers an auto-deploy
vercel --prod --force   # → cache-busting deploy
```

### Branch / repo names

precise-aesthetics pushes to `psrxbodyandskin/precise-aesthetics` (NOT `iambluekb`). Just `git push`. Don't ask.

### "Precise MD Skin Health" vs "PSRx Body & Skin"

Different things. Precise MD Skin Health = product line (keep). PSRx Body & Skin = business name. Don't confuse.

### Anthropic key rotation reminder

`ANTHROPIC_API_KEY` was pasted in P12 conversation transcript on 2026-05-05. **Rotate before launch.** Generate new key in Anthropic console → revoke old → replace in `.env.local` + `vercel env rm/add ANTHROPIC_API_KEY production`.

### In-memory rate limiting is a soft throttle

`lib/rate-limit.ts` uses an in-memory `Map` that's per-Vercel-lambda. Cold-started lambdas have their own counters. The 5/IP/min for public forms and 20/admin/hour for agent endpoints will be approximately correct under realistic traffic but are not hard guarantees.

Migrate to Redis-backed (Upstash / Vercel KV) in P13 before scale. The interface (`RateLimitResult`) is stable; only the bucket store changes.

---

## Spec-vs-reality drift

### `SANITY_API_TOKEN` (spec) vs `SANITY_API_READ_TOKEN` (code)

`spec/SESSION-P12-HARDENING-RUNBOOK.md` § Production env lists `SANITY_API_TOKEN`. Actual code in `lib/sanity/client.ts` uses `SANITY_API_READ_TOKEN`. Code is the truth. Already documented in `audits/PROD-ENV-VERIFICATION.md`.

### `practice_user_certifications` (P12 spec) vs `practice_certifications` (actual table)

`spec/SESSION-P12-HARDENING-RUNBOOK.md` § RLS audit lists `practice_user_certifications`. Actual table is `practice_certifications` (per `0011_training.sql`); P9.1 added a `practice_user_id` column to it but didn't rename the table. Code uses the real name. The spec was wrong; documented in `audits/RLS-AUDIT-RESULTS.md`.

### P1 + P3 lack standalone session specs

`PORTAL-MASTER-SPEC.md` references P1 (Auth Foundation) and P3 (Setup Wizard + Portal Login) as 12-session steps, but no `spec/SESSION-P1-*.md` or `spec/SESSION-P3-*.md` files exist. Implementation lives in code + the master spec's overview. The P12 audit treats the running code + master spec as the integration check substrate for those phases.

### `audit_log` column names — `actor_user_id` (spec) vs `actor_id` (code), no `practice_id` column

P14 spec (`spec/SESSION-P14-AUDIT-LOG-VIEWER.md`) assumes columns named `actor_user_id`, `actor_type` (with `'admin' | 'practice' | 'system'` values), and `practice_id` on the `audit_log` table. **Actual schema** (created in `0004_rls_framework.sql`):

| Spec said | Code has |
|---|---|
| `actor_user_id` | `actor_id` |
| `actor_type` | `actor_role` |
| values include `'system'` | NULL = system action |
| `practice_id` column | (does not exist) |
| (not mentioned) | `ip_address inet` |

Code is the truth. Spec was wrong. We do NOT alter the table to match the spec.

**Practical impacts:**
- P14's RPCs (`0017_audit_log_rpcs.sql`) use the real column names.
- `lib/admin/audit-log.ts` has the same drift note at the top of the file so future sessions don't re-discover this.
- **Practice filter limitation**: there is no `practice_id` column. The audit log viewer's practice filter matches entries where `target_type = 'practice' AND target_id = filter_practice_id`. This catches entries where the practice IS the target (e.g., `practice.invite`, `practice.activate`) but MISSES entries where a practice is referenced inside `metadata`. The UI surfaces this limitation as a prominent footnote when the practice filter is active. Operators investigating an issue should walk back from the specific target_id (treatment, adverse event, etc.), not from the practice filter.
- **Actor role NULL = "System"**: service-role actions with no acting user (webhook-triggered audits, scheduled jobs). The UI renders NULL as "System" with a tooltip. The actor filter dropdown has a sentinel `system` option that translates to `actor_role IS NULL` server-side.

If a future session needs richer practice-context filtering, options are:
1. Add a `practice_id` column to `audit_log` with a backfill strategy. Major schema change; not free.
2. Use JSONB ops to search metadata. Slow without an index; consider a GIN index on `metadata` if this becomes a real need.
3. Track as P15+ if compliance asks.

---

## Security low findings (deferred)

### `is_user_certified_for_device` RPC has no caller-scope gate

`supabase/migrations/0012_per_user_certifications.sql:161-180`. SECURITY DEFINER, accepts arbitrary `practice_user_id`. Cross-practice probing returns a single boolean — not exploitable but not zero-information.

P13 fix: add `IF NOT (is_admin() OR practice_user_id IN (SELECT id FROM practice_authorized_users WHERE practice_id = current_practice_id())) THEN RAISE...;`. Requires a migration.

### Auth endpoints rely on Supabase Auth platform throttling

Login, password reset, magic-link request are direct client → Supabase Auth API calls (not via our Next.js routes). Supabase Auth has its own rate limits at the platform level. App-level limits would require building wrapper routes that proxy to Supabase Auth — non-trivial.

P13: build wrappers if app-level limits become necessary.

---

**Last updated: 2026-05-06 (P12.5 polish).**
