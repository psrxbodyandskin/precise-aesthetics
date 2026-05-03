# Precise Aesthetics — Project Instructions

## Project
B2B clinical technology company website. Flagship system featuring a pico laser as the first instance.
Launch: August 8, 2026, Civic Opera Building rooftop, Chicago.
Domain: preciseaesthetics.com

## Primary Audience
Practitioners (derms, APRNs, PAs, medspa owners, plastic surgeons).
Primary conversion: demo request via Cal.com.

## Brand Architecture
- **PS Medical Aesthetics, LLC** = legal entity (used only in legal copy)
- **Precise Aesthetics** = parent company / brand / website
- **The Precise System™** *(working name, may change)* = the four-pillar architecture: Device · Protocols · Biologic Control · Data Intelligence Layer
- **Precise Pico™** = first device instance of the system (4-wavelength pico laser)
- Future devices (Precise RF, Precise IPL, etc.) will each ship as their own complete system using the same four-pillar architecture

## The Core Reframe (Critical)
We are NOT a pico laser company. We are a clinical technology company that builds complete systems. The pico laser is one pillar of one system. This framing replicates as new devices ship.

When writing about the company:
- "Precise Aesthetics is a clinical technology company that ships complete dermatologic systems."
- "Precise Pico is the first instance of the Precise System."
- "The system: Device, Protocols, Biologic Control, Data."

## Positioning
**Brand promise (hero):** "Predictable outcomes across every skin type."
**Section thesis (sub-hero):** "Built for the patients the industry has historically struggled to treat."
**Tagline / hashtag:** "Skin of every shade."

The four pillars equal each other in importance — the device does not lead the others.

## What Carries Trust on the Site (No Personalities)
- The system itself (the four pillars working as a closed loop)
- The PIH Prevention Protocol™ as the differentiator
- The Data Intelligence Layer (real-world outcomes refining protocols)
- FDA clearance status (once secured)
- KOL adoption post-launch

**No founder, no clinician, no individual face represents us publicly.** No "About the Founder," no "Meet the Team," no headshots of leadership in marketing. The product is the brand.

## Tech Stack (Locked)
- Next.js 15 App Router, TypeScript, React Server Components
- Tailwind CSS v4 + shadcn/ui (new-york, neutral, CSS variables)
- Sanity v3 (CMS, embedded at /studio)
- Supabase (Postgres, Auth, Storage, RLS)
- Resend + React Email (transactional)
- Cal.com cloud (free tier, embedded)
- React Hook Form + Zod
- Framer Motion (restrained, purposeful only)
- PostHog + Vercel Analytics
- Lucide React icons
- next/font (self-hosted Fraunces + Inter)

## What This Project Is NOT
- Not using Stripe (no payments at launch)
- Not direct-to-consumer (B2B only)
- Not e-commerce at launch
- Not a generic medical device site
- Not a personality-led brand
- **Not a "pico laser site" — system-first throughout**

## Two Products, Both Shipping Day 1
1. **Marketing site** — public, B2B lead generation
2. **Practitioner portal** — gated, contains protocols, treatment logging, biologic control kit info, Data Intelligence Layer admin

## Practitioner Portal — Day 1 Scope
- Manual account provisioning (admin creates account when device sells, no public registration)
- Authenticated access to proprietary protocols (Sanity-driven, gated)
- Treatment outcome logging
- Aggregate outcome data flows to internal admin dashboard
- Internal admin reviews data quarterly, suggests protocol updates
- Future phases: kit reordering, training videos, certification tracking, ML recommendations

## Data Intelligence Layer (Public-Facing Claim, Real Build)
- Build: Level 2 — outcome tracking + admin dashboard with protocol update suggestions
- Public copy: measured ("Every session contributes to real-world data that refines our protocols")
- Post-launch evolution: Level 3 (active recommendations) and Level 4 (ML predictive)
- Never overpromise ML capabilities we don't have yet

## Design System Discipline (CRITICAL)
1. Before generating ANY UI, read `design-system/MASTER.md` (technical) and `design-system/BRAND-IDENTITY.md` (strategy and voice).
2. For page-specific work, also check `design-system/pages/[page-name].md` if it exists. Page rules override Master.
3. Use ONLY tokens defined in MASTER.md.
4. Run the pre-delivery checklist in MASTER.md before declaring any UI "done."
5. When MASTER and BRAND-IDENTITY conflict: MASTER wins for code, BRAND-IDENTITY wins for brand strategy and voice.

## Editorial Voice
- Clinical authority, editorial restraint, premium warmth.
- Reference brands: Stripe (clarity), Linear (craft), Aesop (warmth), NEJM (authority).
- Sentence case headlines. No exclamation points. No emoji in marketing.
- The system is the subject of every sentence — not "we," not "our team."

## Sanity Content Model
- `protocol` — gated, only rendered behind portal auth, never indexed publicly
- `indication` — taxonomy
- `caseStudy` — gated, requires consentObtained=true to publish
- `event` — public (launch event)
- `pressItem` — public
- `siteSettings` — singleton, public config

**No `teamMember` schema for public rendering.** Authoring attribution in Sanity Studio is metadata only.

## Supabase Schema
Tables: `leads`, `demo_requests`, `event_rsvps`, `practitioners` (auth-linked), `treatment_logs`, `outcome_metrics`.
RLS enabled by default. Public writes through `/api/*` routes only.
Practitioner portal reads protected by Supabase Auth.
HIPAA-aware: no PHI in CMS. Treatment logs use de-identified profile data only.

## Conversion Architecture
- Homepage → /demo (Cal.com booking)
- Launch page → /api/rsvp (Supabase + Resend confirmation)
- Teaser/footer → /api/lead (email capture, Resend welcome)

## Performance Standards
- Lighthouse 95+ on every public page (mobile + desktop)
- LCP < 2s on 4G
- All images optimized (next/image, Sanity image CDN)
- Fonts subset and preloaded via next/font

## Accessibility (Non-Negotiable)
- WCAG 2.2 AA minimum on all pages
- Keyboard navigable, focus states visible
- prefers-reduced-motion respected
- Color contrast 4.5:1 body, 3:1 large
- Alt text required on all images

## Regulatory Notes
- All medical claims need regulatory review before publishing
- Before/after photos require consentObtained=true in Sanity
- Indications language must match FDA clearance once available
- HIPAA notice page required at /hipaa-notice
- Pre-FDA-clearance: limit to general "laser dermatology technology" language

## Session Workflow
1. Scaffold + plumbing ✅
2. Sanity schemas + Supabase tables
3. Design system base components
4. Teaser landing page (ship to prod)
5. Homepage (system-first)
6. /system page (lead the four pillars)
7. /pico product page (one instance of the system)
8. /system/pih-prevention, /system/biologic-control, /system/data-intelligence
9. /protocols (public marketing page about the gated library)
10. /about, /contact, /press
11. /launch event page + RSVP
12. /demo page + Cal.com embed
13. Practitioner portal
14. SEO + structured data + sitemap + robots
15. Pre-launch QA

## Definition of Done (Per Component/Page)
- [ ] Reads from MASTER.md tokens only
- [ ] TypeScript strict, no `any`
- [ ] Responsive: 375, 768, 1024, 1440
- [ ] Keyboard accessible
- [ ] prefers-reduced-motion handled
- [ ] Lighthouse 95+
- [ ] No console errors or warnings
- [ ] Loading + error + empty states
- [ ] Copy reads "system-first" not "device-first"
- [ ] Pre-delivery checklist from MASTER.md passed

## Deployment
- main → Vercel production (preciseaesthetics.com)
- Preview deploys on every PR
- Sanity webhook → /api/revalidate for ISR

## ui-ux-pro-max Skill Usage
The ui-ux-pro-max skill is installed and may auto-activate on UI work.
1. MASTER.md is source of truth — always wins
2. BRAND-IDENTITY.md covers brand strategy, voice, visual direction
3. Use ui-ux-pro-max for: anti-pattern checks, accessibility, stack-specific best practices
4. Do NOT use it to generate new colors, type pairings, or design systems
5. If the skill suggests a token not in MASTER.md, ignore it

## Communication
When unclear, ask before assuming. When in doubt about brand voice, default to: clinical authority with editorial restraint and premium warmth. The system is the subject. Never personality-driven.

## Known Gotchas

### Supabase project Site URL must match production domain (locked Session P2)

The Supabase project's **Site URL** setting (Dashboard → Authentication → URL Configuration → Site URL) is used as the default base for all auth-flow redirects: invite links, password-reset links, magic links, OAuth callbacks. Any `redirect_to` we pass to `supabase.auth.admin.generateLink()` or `resetPasswordForEmail()` is **silently overridden** if the Site URL is set to anything other than the production domain.

**Required setting for production:**
- Site URL: `https://preciseaesthetics.com`
- Additional Redirect URLs: `http://localhost:3457` (for local dev)

**How this surfaces:** During P1 password-reset debugging on 2026-05-02, generated invite/recovery links came back with `redirect_to: "http://localhost:3000"` despite explicit `redirect_to: "https://preciseaesthetics.com/..."` in the API call. Cost ~30 minutes to diagnose.

**Pre-test step before any production invite/reset flow:** verify Site URL matches the active deploy domain. The setting only changes via the dashboard — there's no env var or migration that controls it.

---

### audit_log types added in P2 (housekeeping)

P1's `0004_rls_framework.sql` added the `audit_log` table but didn't add types to `lib/supabase/types.ts`. P2 backfilled the types (Row/Insert/Update + the `Functions` block for `log_audit`, `auth_role`, `is_admin`, `is_practice`, `current_practice_id`). That loop is closed — future sessions can use `Database["public"]["Tables"]["audit_log"]["Row"]` directly without further work.

---

### Auth: roles MUST live in `app_metadata`, not `user_metadata` (locked Session P1)

Supabase Auth has two metadata buckets on every user:

- **`user_metadata`** — user-editable through the standard `auth.updateUser()` endpoint. Suitable only for non-security preferences (display name, locale).
- **`app_metadata`** — admin-only writable (requires the service-role key). The only trustworthy bucket for authorization claims.

**Storing role in `user_metadata` is a privilege-escalation vulnerability.** Any authenticated user can call `auth.updateUser({ data: { role: 'admin' } })` and promote themselves.

**Canonical claims:**
- `app_metadata.role: "practice" | "admin"` — used by middleware + RLS
- `app_metadata.practice_id: uuid` — populated during practice provisioning (P2)

These are read by `lib/auth/server.ts` helpers (`getCurrentUser`, `requirePractice`, `requireAdmin`) and by SQL helpers in `0004_rls_framework.sql` (`auth_role()`, `is_admin()`, `current_practice_id()`).

When provisioning users (P2 onward), set claims via the **service role** client only:

```ts
// CORRECT — service role, app_metadata
await getServiceClient().auth.admin.updateUserById(userId, {
  app_metadata: { role: "practice", practice_id: newPracticeId },
});

// WRONG — never store role in user_metadata
await supabase.auth.updateUser({ data: { role: "practice" } });
```

See `spec/RLS-PATTERNS.md` for the full RLS conventions that downstream sessions follow.

---

## Known Issues / Tech Debt

### Tailwind v4 ↔ shadcn token mismatch (decision needed before Session 5+)
shadcn primitives use `bg-popover`, `bg-card`, `bg-accent`, etc., which in Tailwind v4 resolve from `--color-popover` / `--color-card` / `--color-accent`. `globals.css` defines the shadcn-style `--popover` / `--card` / `--accent` variables but **not** the `--color-*` aliases Tailwind v4 expects. Result: those utilities render transparent.

Discovered Session 4 in `<SelectContent>` (popover bg). Worked around by passing explicit brand classes (`bg-bone-50`, `text-ink-900`, etc.) in `components/forms/LeadForm.tsx`.

Will hit any other shadcn floating component that lands in future sessions: **Sheet, Dialog, Tooltip, DropdownMenu, Popover, HoverCard, Menubar, ContextMenu, Command** at minimum. Decide before more land:

- **Option A** — One-time fix in `globals.css`: add `--color-popover: var(--popover);` (and equivalent aliases for `card`, `accent`, `muted`, `secondary`, `destructive`, `primary`, `border`, `input`, `ring`, `foreground`, `background`). Restores shadcn defaults across the board with one diff.
- **Option B** — Keep patching each primitive's `className` per-component. Stays scoped but adds friction every time a new shadcn floating component is introduced.

Recommend Option A before Session 5 (full homepage) ships, since Sheet/Dialog/Tooltip are likely needed.

### `brand-500` on light backgrounds fails WCAG AA (audit links/CTAs before launch)
[BRAND-IDENTITY.md:295](design-system/BRAND-IDENTITY.md#L295) prescribes `brand-500 #5891CA` for *"links, CTAs on light"*. Computed contrast on bone-100 (`#FAF7F2`) is **3.11:1** — fails 4.5:1 for normal text. Discovered Session 4 via Lighthouse on the eyebrow (already fixed: bone eyebrow now uses `brand-700`, see MASTER.md "Color Pairings (canonical)").

Implication: any `<a>` or non-large CTA text rendered in `brand-500` on a light surface will fail contrast the same way. Before launch:
- Audit every link/CTA across the site for foreground = `brand-500` on bone/cream/champagne.
- Decide canonical: either bump light-surface link color to `brand-700` (~8:1, brand-blue retained) or `ink-700` (~14:1, neutral). Update BRAND-IDENTITY.md L295 to match shipped reality.
- Large-text CTAs (≥18pt or ≥14pt bold) only need 3:1, so some uses of `brand-500` may still be compliant — verify per-instance, don't blanket replace.
