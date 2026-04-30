# Precise Aesthetics — Project Instructions

## Project
B2B medical device company website. Flagship: Precise Pico™ pico laser.
Launch: August 8, 2026, Civic Opera Building rooftop, Chicago.
Domain: preciseaesthetics.com

## Primary Audience
Practitioners (derms, APRNs, PAs, medspa owners, plastic surgeons).
Primary conversion: demo request via Cal.com.

## Brand Architecture
- **PS Medical Aesthetics, LLC** = legal entity (used only in legal copy: terms, privacy, footer copyright)
- **Precise Aesthetics** = parent company / brand / website (everything user-facing)
- **Precise Pico™** = flagship device product
- Future products live under Precise Aesthetics (Precise RF, Precise Skin, etc.)

## Positioning
"Protocol-driven pico laser. Predictable outcomes across every skin type."

Wedge: PIH Prevention Protocol™ — safety on Fitzpatrick IV–VI.
Tagline: "Skin of Every Shade."

**This is a technology + protocol IP company.** The brand stands on the system, the protocols, and the outcomes data — not on individual personalities. No founder or clinician is publicly featured on the site. The product is the brand.

## What Carries Trust on the Site (Since No Public Personalities)
- The protocols themselves (depth, structure, scope)
- The PIH Prevention Protocol™ as the differentiator
- The Data Intelligence Layer (real-world outcomes data refining protocols)
- FDA clearance status (once secured)
- KOL adoption (after launch — the practitioners who use it become public references)

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
- Not e-commerce at launch (kits sold with device, phase 2 reorder portal)
- Not a generic medical device site (luxury launch experience)
- **Not a personality-led brand** — no founder bios, no clinical director profile, no "meet the team" pages

## Two Products, Both Shipping Day 1
1. **Marketing site** — public, B2B lead generation
2. **Practitioner portal** — gated, authenticated, contains protocols + treatment logging + Data Intelligence Layer admin

## Practitioner Portal — Day 1 Scope
- Manual account provisioning (admin creates account when device sells, no public registration)
- Authenticated access to proprietary protocols (Sanity-driven, gated)
- Treatment outcome logging (indication, parameters, sessions, outcomes)
- Aggregate outcome data flows to internal admin dashboard
- Internal admin reviews data quarterly, suggests protocol updates
- Future phases: kit reordering, training videos, certification tracking, ML recommendations

## Data Intelligence Layer (Public-Facing Claim, Real Build)
- Build: Level 2 — outcome tracking + admin dashboard with protocol update suggestions
- Public copy: measured ("Every session contributes to real-world data that refines our protocols")
- Post-launch evolution: Level 3 (active recommendations to practitioners) and Level 4 (ML predictive)
- Never overpromise ML capabilities we don't have yet

## Design System Discipline (CRITICAL)
1. Before generating ANY UI, read `design-system/MASTER.md` (technical implementation) and `design-system/BRAND-IDENTITY.md` (brand strategy and visual direction).
2. For page-specific work, also check `design-system/pages/[page-name].md` if it exists. Page rules override Master.
3. Use ONLY tokens defined in MASTER.md. No arbitrary hex values. No off-system colors.
4. Run the pre-delivery checklist in MASTER.md before declaring any UI "done."
5. When MASTER and BRAND-IDENTITY conflict: MASTER wins for code, BRAND-IDENTITY wins for brand strategy and voice.

## Editorial Voice
- Clinical authority, editorial restraint, premium warmth.
- Reference brands: Stripe (clarity), Linear (craft), Aesop (warmth), NEJM (authority).
- Anti-references: generic medical device sites, MedSpa templates, AI purple gradients, personality-led brand sites.
- Sentence case headlines. No exclamation points. No emoji in marketing.

## Sanity Content Model
- `protocol` — gated, only rendered behind portal auth, never indexed publicly
- `indication` — taxonomy (used internally for protocol categorization)
- `caseStudy` — gated, requires consentObtained=true to publish
- `event` — public (launch event)
- `pressItem` — public
- `siteSettings` — singleton, public config

**No `teamMember` schema.** Authoring attribution in Sanity Studio is metadata only — never rendered on the public site.

## Supabase Schema
Tables: `leads`, `demo_requests`, `event_rsvps`, `practitioners` (auth-linked), `treatment_logs`, `outcome_metrics`.
RLS enabled by default. Public writes through `/api/*` routes only.
Practitioner portal reads protected by Supabase Auth.
HIPAA-aware: no PHI in CMS, ever. Treatment logs use de-identified patient profile data only.

## Conversion Architecture
- Homepage → /demo (Cal.com booking)
- Launch page → /api/rsvp (Supabase + Resend confirmation)
- Teaser/footer → /api/lead (email capture, Resend welcome)

## File Organization Rules
- Components organized by domain: /components/marketing, /components/portal, /components/forms, /components/ui
- Server-only code in /lib with clear server.ts vs client.ts
- API routes are thin — validate with Zod, write to Supabase, send via Resend, respond
- Sanity queries colocated in /lib/sanity/queries.ts with next.tags for ISR
- Portal routes under /app/(portal)/portal/* with auth middleware

## Performance Standards
- Lighthouse 95+ on every public page (mobile + desktop)
- LCP < 2s on 4G
- All images optimized (next/image, Sanity image CDN)
- Fonts subset and preloaded via next/font

## Accessibility (Non-Negotiable)
- WCAG 2.2 AA minimum on all pages
- Keyboard navigable
- Focus states visible (no outline:none without replacement)
- prefers-reduced-motion respected for all Framer Motion
- Color contrast 4.5:1 body text, 3:1 large text
- Alt text required on all images (Sanity field enforces)

## Regulatory Notes
- All medical claims need regulatory review before publishing
- Before/after photos require consentObtained=true in Sanity
- Indications language must match FDA clearance once available
- HIPAA notice page required at /hipaa-notice
- Pre-FDA-clearance: limit claims to general "laser dermatology technology" language

## Session Workflow
Each session has a tight scope. Order:
1. Scaffold + plumbing
2. Sanity schemas + Supabase tables
3. Design system base components (Header, Footer, Button, Section)
4. Teaser landing page (ship to prod, capture emails)
5. Homepage
6. /pico product page
7. /system + sub-pages (including Data Intelligence Layer)
8. /about (company-level, no personalities), /contact, /press
9. /launch event page + RSVP
10. /demo page + Cal.com embed + form
11. Practitioner portal (auth, protocol viewer, treatment logging, admin dashboard)
12. SEO + structured data + sitemap + robots
13. Pre-launch QA: a11y, Lighthouse, cross-browser

## Definition of Done (Per Component/Page)
- [ ] Reads from MASTER.md tokens only
- [ ] TypeScript strict, no `any`
- [ ] Responsive: 375, 768, 1024, 1440
- [ ] Keyboard accessible
- [ ] prefers-reduced-motion handled
- [ ] Lighthouse 95+
- [ ] No console errors or warnings
- [ ] Loading + error + empty states
- [ ] Pre-delivery checklist from MASTER.md passed

## Deployment
- main → Vercel production (preciseaesthetics.com)
- Preview deploys on every PR
- Sanity webhook → /api/revalidate for ISR

## ui-ux-pro-max Skill Usage
The ui-ux-pro-max skill is installed and may auto-activate on UI work.

Rules of precedence:
1. `design-system/MASTER.md` is the source of truth — always wins
2. `design-system/BRAND-IDENTITY.md` covers brand strategy, voice, and visual direction
3. Use ui-ux-pro-max for: anti-pattern checks, accessibility validation, stack-specific best practices, pre-delivery checklist enforcement
4. Do NOT use ui-ux-pro-max to generate new color palettes, typography pairings, or design systems — those are locked in MASTER.md
5. If the skill suggests a token/style not in MASTER.md, ignore it

## Communication
When unclear, ask before assuming. When the spec conflicts with MASTER.md, MASTER.md wins. When in doubt about brand voice, default to: clinical authority with editorial restraint and premium warmth — never personality-driven.
