# Precise Aesthetics — Project Instructions

## Project
B2B medical device company website. Flagship: Precise Pico™ pico laser.
Launch: August 8, 2026, Civic Opera Building rooftop, Chicago.
Domain: preciseaesthetics.com

## Primary Audience
Practitioners (derms, APRNs, PAs, medspa owners, plastic surgeons).
Primary conversion: demo request via Cal.com.

## Brand Architecture
- **Precise Aesthetics** = parent company (the website)
- **Precise Pico™** = flagship device product
- Future products live under Precise Aesthetics (Precise RF, Precise Skin, etc.)

## Positioning
"Protocol-driven pico laser. Predictable outcomes across every skin type."
Wedge: PIH Prevention Protocol™ — safety on Fitzpatrick IV–VI.
Tagline: "Skin of Every Shade."

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
- next/font (self-hosted)

## What This Project Is NOT
- Not using Stripe (no payments at launch)
- Not direct-to-consumer (B2B only)
- Not e-commerce at launch (kits sold with device, phase 2 reorder portal)
- Not a generic medical device site (luxury launch experience)

## Design System Discipline (CRITICAL)
1. Before generating ANY UI, read `design-system/MASTER.md`.
2. For page-specific work, also check `design-system/pages/[page-name].md` if it exists. Page rules override Master.
3. Use ONLY tokens defined in MASTER.md. No arbitrary hex values. No off-system colors.
4. Run the pre-delivery checklist in MASTER.md before declaring any UI "done."

## Editorial Voice
- Clinical authority, editorial restraint, premium warmth.
- Reference brands: Stripe (clarity), Linear (craft), Aesop (warmth), NEJM (authority).
- Anti-references: generic medical device sites, MedSpa templates, AI purple gradients.

## Sanity Content Model
Roni Bolton (Clinical Director) authors protocols in Sanity Studio.
Schemas: protocol, indication, teamMember, caseStudy, event, pressItem, siteSettings.
Protocol pages are the SEO moat — structured for ranking on clinical queries.

## Supabase Schema
Tables: leads, demo_requests, event_rsvps, practitioners (phase 2).
RLS enabled by default. Public writes through /api/* routes only.
HIPAA-aware: no PHI in CMS, ever.

## Conversion Architecture
- Homepage → /demo (Cal.com booking)
- Launch page → /api/rsvp (Supabase + Resend confirmation)
- Teaser/footer → /api/lead (email capture, Resend welcome)

## File Organization Rules
- Components organized by domain: /components/marketing, /components/forms, /components/ui
- Server-only code in /lib with clear server.ts vs client.ts
- API routes are thin — validate with Zod, write to Supabase, send via Resend, respond
- Sanity queries colocated in /lib/sanity/queries.ts with next.tags for ISR

## Performance Standards
- Lighthouse 95+ on every page (mobile + desktop)
- LCP < 2s on 4G
- All images optimized (next/image, Sanity image CDN)
- Fonts subset and preloaded via next/font

## Accessibility (Non-Negotiable)
- WCAG AA minimum on all pages
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

## Session Workflow
Each session has a tight scope. Order:
1. Scaffold + plumbing
2. Sanity schemas + queries
3. Design system base components (Header, Footer, Button, Section)
4. Teaser landing page (ship to prod immediately, capture emails)
5. Homepage
6. /pico product page
7. /system + four sub-pages
8. /protocols index + dynamic [slug] pages
9. /about, /contact, /press
10. /launch event page + RSVP
11. /demo page + Cal.com embed + form
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

## Communication
When unclear, ask before assuming. When the spec conflicts with MASTER.md,
MASTER.md wins. When in doubt about brand voice, default to: clinical authority
with editorial restraint and premium warmth.
