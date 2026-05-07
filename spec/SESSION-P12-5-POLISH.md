# Session P12.5 — Autonomous Polish Pass

> Run after P14 (Audit Log Viewer) is deployed and migration 0017 applied. Final build session before launch operational work. Opus runs autonomously — no pre-flight Q&A required, no per-phase pre-approval. Stop only for architectural blockers (defined below).

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/PORTAL-MASTER-SPEC.md`
6. `spec/RLS-PATTERNS.md`
7. `KNOWN-GOTCHAS.md` (the deferred items list — this is the input)
8. `audits/SECURITY-AUDIT-RESULTS.md`
9. `audits/END-TO-END-VERIFICATION.md`
10. This spec

---

## The Use Case

The build is feature-complete. P12 hardened security. P13 added admin utilities. P13.5 added settings. P14 added audit log viewing. Migrations through 0017 are applied.

What remains is polish — work that doesn't change behavior but raises quality. Lint errors flagging pre-Compiler patterns. Accessibility gaps that risk legal exposure for clinical software. Lighthouse scores under target. Empty states that leave users confused. Inline copy off-voice.

This session resolves all of that autonomously.

---

## Goal

After this session:
- All 18 React hooks v7 strict-rule violations resolved
- CSP (Content Security Policy) shipped with route-by-route compatibility
- Lighthouse 95+ on every public + portal route, 85+ on admin
- WCAG AA passes on portal (focus order, ARIA, contrast, keyboard nav)
- Mobile/iPad regression sweep complete
- Edge-case empty states audited and fixed
- Inline copy reviewed across portal + admin
- Documentation cross-referenced
- shadcn `bg-popover` global alias fix landed
- brand-500 link contrast audit complete
- `P12.5-POLISH-RESULTS.md` documents every finding + fix + remaining open items

---

## Critical Constraints

1. **No new features.** Repair work only. If something needs new functionality, log as P15+ and skip.
2. **No architectural changes.** No new tables, no new routes, no schema modifications.
3. **No new RLS policies.** Don't touch security boundaries. If a security gap is found, STOP and surface.
4. **MASTER.md tokens only.** No new colors, fonts, icons.
5. **All migrations remain held.** This session writes none.
6. **Reduced motion respected** in all UI fixes.
7. **Build must remain green.** Don't ship if tsc/build/lint regress.

## Hard stops (raise before fixing)

Stop and report back to me before continuing if any of these surface:

- Any RLS gap or security finding (critical/high/medium)
- Any change requiring a new spec or architectural decision
- Any change that touches data model, schema, or RLS policies
- Any change that breaks the build (tsc EXIT != 0, next build EXIT != 0)
- Any third-party service integration concern (Anthropic, Resend, Sanity, Supabase API changes)
- Any finding that requires human judgment on UX direction (don't auto-redesign)
- Lint errors that aren't mechanical fixes (real refactors should be flagged)
- Accessibility issues that require new component primitives

Otherwise: fix, document, continue.

---

# THE WORK

## Phase 1 — React hooks v7 strict-rule violations (18 errors)

File:line list lives in `KNOWN-GOTCHAS.md`. Three patterns:

**Pattern A — setState in effect (11 instances)**
- Pattern: `useEffect(() => { setState(value) })` runs immediately on mount
- Fix: move to initial state via lazy init, OR guard with condition, OR derive without state

**Pattern B — Impure function during render (3 instances)**
- Pattern: `Math.random()`, `Date.now()` referenced in render path
- Fix: move to `useRef` initialized once, OR `useMemo`, OR generate in effect

**Pattern C — Function hoisting / closure mutation (4 instances)**
- Pattern: 3D animation code, function declarations referenced before definition or local variables modified after render
- Fix: hoist function declarations to module level, OR memoize with `useCallback`, OR refactor mutation to ref-based pattern

For each fix:
- Apply minimum-change refactor (don't redesign the component)
- Verify visually that behavior is unchanged
- Run `npm run lint` after each file to confirm error cleared
- Commit pattern: `polish(p12.5): resolve react-hooks violation in {file}`

If any fix isn't mechanical (requires real refactor or behavior change consideration): STOP, document the file, surface for review.

## Phase 2 — CSP (Content Security Policy)

Currently shipped with X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy. CSP punted from P12.

Implementation:
- Add CSP via `next.config.ts` headers function
- Use nonce-based CSP for inline scripts (Next 16 supports this natively)
- Allow `'self'` for default-src
- Allow specific domains for:
  - Sanity Studio at `/studio` — `https://*.sanity.io`
  - PostHog — `https://*.posthog.com`, `https://us.i.posthog.com`
  - Cal.com (if used in marketing site) — `https://*.cal.com`
  - Sentry — `https://*.sentry.io`
  - Anthropic — N/A (server-side only)
- `img-src` allows `'self'`, `data:`, `https:` (broad for marketing imagery)
- `style-src` allows `'self'`, `'unsafe-inline'` (Tailwind requires this; document as known acceptable risk)
- `font-src` allows `'self'`, `https://fonts.gstatic.com` if Google Fonts in use
- `frame-ancestors 'none'` (already covered by X-Frame-Options DENY)

Test sequence:
1. Apply CSP in report-only mode first via `Content-Security-Policy-Report-Only` header
2. Visit every public route, every portal route, every admin route, /studio
3. Open browser console, capture all CSP violation reports
4. Adjust policy to allow legitimate sources
5. After 0 violations on a clean walkthrough, switch from report-only to enforcing mode
6. Document final CSP in code comment + `P12.5-POLISH-RESULTS.md`

If a route can't be made CSP-compliant without weakening the policy meaningfully: STOP, document the route + the reason, surface for review.

## Phase 3 — Lighthouse audits

Run Lighthouse against production preview URLs for:

**Public marketing routes (target: 95+ across Performance, Accessibility, Best Practices, SEO):**
- `/`
- `/system`, `/system/protocols`, `/system/delivery`, `/system/biologic-control`, `/system/data-intelligence`
- `/pico`
- `/about`
- `/contact`
- `/demo`
- `/terms`
- `/privacy`

**Portal routes (target: 95+ on Accessibility, 90+ on others — practitioners on iPads over hospital wifi):**
- `/portal/login`
- `/portal` (post-auth dashboard)
- `/portal/protocols`
- `/portal/protocols/[slug]` (sample one)
- `/portal/treatments`
- `/portal/treatments/new`
- `/portal/training`
- `/portal/notifications`
- `/portal/settings/notifications`

**Admin routes (target: 85+ across all categories — internal use, less performance-critical):**
- `/admin/login`
- `/admin/dashboard`
- `/admin/practices`
- `/admin/inbox`
- `/admin/audit-log`

For each route below target:
1. Inspect Lighthouse report
2. Apply low-risk fixes:
   - Image optimization (Next Image component, proper sizing, WebP)
   - Font optimization (preload, font-display: swap)
   - Lazy loading non-critical components
   - Bundle size reductions (tree-shake unused imports)
3. Re-run Lighthouse
4. Document score before + after

Don't attempt fixes that require:
- New library additions (e.g., switching from PostHog to a lighter analytics)
- Architectural changes (e.g., moving from SSR to ISR)
- Breaking API changes

If a route can't reach target without one of those: document score + reason in `P12.5-POLISH-RESULTS.md` as accepted limitation.

## Phase 4 — Accessibility AA pass (portal-priority)

Use axe-core or Lighthouse accessibility audit on portal routes.

Common findings to fix:
- Missing alt text on images
- Form labels not associated with inputs (use `htmlFor` + `id`)
- Color contrast failures (especially brand-500 on light backgrounds — see KNOWN-GOTCHAS.md)
- Missing ARIA labels on icon-only buttons
- Focus order not following DOM order
- Skip-to-main-content link missing
- Landmark regions (main, nav, header, footer) not used
- Modal/dialog focus trap not working (or focus not returning on close)
- Tables without `<th scope>` attributes
- Forms without `<fieldset>` + `<legend>` for grouped inputs

For each fix:
- Apply minimum-change adjustment
- Verify with keyboard-only navigation
- Verify with screen reader announcement (use macOS VoiceOver or NVDA)

For brand-500 contrast:
- Run audit per KNOWN-GOTCHAS.md notes
- Where brand-500 fails AA on bone-100 background:
  - Replace with brand-700 for body text and links
  - Reserve brand-500 for non-text uses (chart elements, decorative accents) where contrast doesn't apply
- Document the resolution in design-system/MASTER.md token notes

Admin routes get a lighter pass — fix critical blockers (form labels, keyboard nav) but don't gate launch on admin-side AA perfection.

## Phase 5 — Mobile/iPad regression sweep

Test viewports:
- 375px (iPhone SE / small mobile)
- 390px (iPhone Pro)
- 768px (iPad portrait)
- 1024px (iPad landscape)

For each viewport, walk:
- Marketing site: home, /system, /pico, /demo, /contact
- Portal: dashboard, protocol viewer, treatment form, training module, notifications
- Admin: dashboard, inbox, audit log, AI agents

Check for:
- Horizontal scroll (forbidden everywhere)
- Touch targets < 44×44px (accessibility AA)
- Cut-off content (especially around safe-area insets on iOS)
- Modal/sheet rendering issues
- Filter bars wrapping correctly
- Charts responsive
- Tables transposing to cards on narrow viewports (per existing P5 / P7 patterns)

Common fixes:
- `min-w-0` on flex children to prevent overflow
- `overflow-hidden` on parent where needed
- Increase padding/margin on tap targets
- Use `dvh` units instead of `vh` for full-height panels (handles iOS URL bar)
- Test with real iOS Safari (or simulator) for the URL-bar collapse behavior

Document each viewport's findings + fixes.

## Phase 6 — Empty state audit

For every list view, verify three empty states:
1. **Genuinely empty** — no data exists yet
2. **Filtered empty** — data exists but filters exclude all
3. **Loading/error** — data is loading or fetch failed

Routes to audit:
- `/portal/protocols` (P5 already has 3-state — verify still working)
- `/portal/treatments` (filtered list)
- `/portal/training`
- `/portal/notifications`
- `/admin/practices`
- `/admin/inbox` (filtered)
- `/admin/adverse-events`
- `/admin/protocols`
- `/admin/training`
- `/admin/vendors`
- `/admin/stack`
- `/admin/notifications`
- `/admin/audit-log`
- `/admin/ai/runs`
- `/admin/ai/cost`

For each list view missing one of the three states:
- Add the missing state with appropriate copy
- Use the brand register (system-first, calm, no exclamations)
- Provide an action where appropriate (Clear filters, Contact us, etc.)

## Phase 7 — Inline copy review

Walk every screen with a copy-eye:
- Buttons: action verbs, sentence case (no Title Case Mistakes)
- Form labels: clear, no jargon
- Toast messages: brief, factual
- Error messages: actionable (tell the user what to do)
- Helper text: encouraging without being saccharine
- Empty state copy: human, not corporate

Flag any inline string that reads off-voice. Fix the obvious ones; surface ambiguous ones for me to decide.

Particular attention:
- Practitioner portal copy (clinical, calm, professional)
- Email templates (system-first register from BRAND-IDENTITY.md)
- Modal confirmation copy (clear about what's about to happen)

## Phase 8 — shadcn bg-popover global fix

Per KNOWN-GOTCHAS.md, shadcn components reference `bg-popover` token but it's not aliased to a brand color in `globals.css`. Workaround across the codebase has been per-component `bg-bone-50` overrides.

Fix:
- Add `--color-popover: var(--color-bone-50)` to `globals.css` Tailwind v4 token block
- Add `--color-popover-foreground: var(--color-ink-900)`
- Find every per-component `bg-bone-50` override that exists to work around this and remove it
- Verify Popover, Dropdown, Select, Combobox, Tooltip all render with bone background as expected

## Phase 9 — Documentation cross-reference

Pass over the documentation set:
- `CLAUDE.md` — verify "current state" references are accurate (mention of P14, audit log viewer, all migration numbers up to 0017)
- `KNOWN-GOTCHAS.md` — verify everything in this list either has a fix in P12.5 OR a clear post-launch tag
- All `spec/SESSION-*.md` files — verify cross-references between specs are correct (e.g., P10 references P6's adverse event flow correctly)
- `LAUNCH-RUNBOOK.md` — verify operator action items list matches reality (Sentry status, env vars, etc.)
- `audits/END-TO-END-VERIFICATION.md` — verify it covers all 8 flows including any new functionality from P13/P13.5/P14 that should be smoke-tested

If audit log viewer (P14) is missing from the end-to-end verification doc, add a flow for it.

If admin settings/account (P13.5) is missing from end-to-end verification, add a flow for it.

---

# VERIFICATION

Before declaring done:

1. `npm run build` clean
2. `npx tsc --noEmit` clean
3. `npm run lint` clean (0 errors, 0 warnings beyond explicitly accepted ones)
4. `npm audit` — confirm no new critical/high
5. Lighthouse scores documented for every audited route
6. Accessibility audit results documented
7. Mobile sweep findings documented per viewport
8. CSP enforced (not report-only) and verified clean
9. All empty states verified across audited routes
10. Documentation cross-reference complete

---

# DELIVERABLES

`P12.5-POLISH-RESULTS.md` covering:

1. **React hooks fixes** — 18 errors → 0, file:line list with before/after pattern descriptions
2. **CSP** — final policy, routes verified, any accepted limitations
3. **Lighthouse scores** — table of every audited route with before/after scores per category
4. **Accessibility AA** — list of fixes, any remaining gaps with reasoning
5. **Mobile regression** — viewport-by-viewport findings + fixes
6. **Empty states** — list view audit results + additions
7. **Copy edits** — list of strings changed
8. **shadcn bg-popover fix** — files affected, verification
9. **brand-500 contrast resolution** — final token decisions
10. **Documentation cross-reference** — files updated
11. **Items deferred to P15+** — anything that surfaced as out-of-scope architectural work
12. **Final pre-launch state** — confirmation that build is launch-ready (or list of remaining blockers)

After P12.5 ships, the build is feature-complete and quality-polished. Remaining work is operator-side (Sentry DSN, Resend domain, Supabase plan, key rotation, dry-run rituals) leading into Aug 8 launch.
