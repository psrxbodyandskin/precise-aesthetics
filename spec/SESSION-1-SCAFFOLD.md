# Session 1 — Project Scaffold

> Run this in Claude Code from the repo root after `CLAUDE.md` and `design-system/MASTER.md` are committed.

## Context

You have already read `CLAUDE.md` and `design-system/MASTER.md`. All decisions in those files are binding. This session is **scaffold + plumbing only** — no page implementations yet.

## Goal

Stand up a Next.js 15 project for **preciseaesthetics.com** with the locked stack, design tokens wired from `MASTER.md`, fonts loaded, all clients (Sanity, Supabase, Resend, PostHog, Cal.com) configured, and the project building cleanly on Vercel.

## Stack (Locked — Do Not Substitute)

- Next.js 15 (App Router, TypeScript strict, React Server Components)
- Tailwind CSS v4
- shadcn/ui (style: `new-york`, base color: `neutral`, CSS variables: yes)
- Sanity v3 embedded at `/studio`
- Supabase (server + browser clients; service role on server only)
- Resend + React Email
- Cal.com embed (`@calcom/embed-react`)
- React Hook Form + Zod
- Framer Motion
- PostHog (`posthog-js` + `posthog-node`)
- Lucide React
- next/font for self-hosted **Fraunces** (display/headings) + **Inter** (body/UI)

**Not in this project:** Stripe, any payment processor, e-commerce libraries.

## Folder Structure

```
/app
  /(marketing)
    /page.tsx                     → Homepage (placeholder this session)
    /pico/page.tsx
    /system/page.tsx
    /system/pih-prevention/page.tsx
    /system/protocol-library/page.tsx
    /system/treatment-kits/page.tsx
    /system/data-intelligence/page.tsx
    /protocols/page.tsx
    /protocols/[slug]/page.tsx
    /about/page.tsx
    /launch/page.tsx
    /demo/page.tsx
    /resources/page.tsx
    /contact/page.tsx
    /press/page.tsx
    /layout.tsx                   → Marketing layout (header, footer)
  /(legal)
    /privacy/page.tsx
    /terms/page.tsx
    /hipaa-notice/page.tsx
  /studio/[[...tool]]/page.tsx    → Sanity Studio
  /api
    /lead/route.ts                → POST teaser email capture
    /demo-request/route.ts        → POST demo request
    /rsvp/route.ts                → POST event RSVP
    /revalidate/route.ts          → Sanity webhook → revalidateTag
  /robots.ts
  /sitemap.ts
  /layout.tsx                     → Root layout (fonts, providers)

/components
  /ui                             → shadcn primitives
  /marketing                      → Hero, SystemDiagram, etc. (stubs only this session)
  /forms                          → LeadForm, DemoRequestForm, RSVPForm (stubs only)

/lib
  /sanity
    /client.ts
    /queries.ts
    /types.ts
    /image.ts
  /supabase
    /server.ts                    → service role, server-only
    /client.ts                    → anon key, browser
    /types.ts
  /resend
    /client.ts
    /send.ts
  /analytics
    /posthog.ts
  /utils.ts
  /constants.ts                   → site config, nav

/sanity
  /schemas
    /index.ts                     → empty array this session, schemas in Session 2
  /sanity.config.ts
  /sanity.cli.ts

/emails                           → React Email templates (stubs only)

/types
  /index.ts

/styles
  /globals.css                    → Tailwind + design tokens from MASTER.md

/design-system                    → already exists (MASTER.md)
```

## Design Tokens — Wire From MASTER.md

In `app/globals.css`, declare every CSS variable defined in `design-system/MASTER.md` under **Color Tokens**, **Typography**, **Spacing & Layout**, **Radii / Shadows / Borders**, and **Motion**. Do not redefine values — copy them verbatim from MASTER.md so the design system stays single-source-of-truth.

In `tailwind.config.ts`, extend the theme to surface those CSS variables as Tailwind utilities exactly as specified in MASTER.md (e.g., `bg-midnight-500`, `text-cream-100`, `bg-bone-100`, `bg-champagne-200`, etc.). Match the full color scales (50–900 where defined). Also extend `fontFamily.display` and `fontFamily.body` to the font CSS variables.

Default `body` background: `bone-100`. Default body text: `ink-700`. Default font: Inter via `--font-body`.

## Fonts

In `app/layout.tsx`, load fonts via `next/font/google`:

```ts
import { Fraunces, Inter } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz', 'SOFT', 'WONK'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});
```

Apply both `variable` classes on `<html>` so the CSS variables are available globally. Preload both. No other font families anywhere.

## shadcn/ui Setup

Initialize with:
- style: `new-york`
- base color: `neutral`
- CSS variables: yes
- React Server Components: yes

Install these primitives now (page implementations come later):
`button, input, label, textarea, select, checkbox, dialog, sheet, accordion, tabs, badge, card, separator, sonner, form`.

After install, **override the default shadcn CSS variables** in `globals.css` so shadcn components use Precise Aesthetics tokens (map `--background` → `--pa-bone-100`, `--foreground` → `--pa-ink-700`, `--primary` → `--pa-midnight-800`, `--primary-foreground` → `--pa-cream-50`, etc.). Keep both light and dark mode variable blocks but don't ship a theme toggle this session.

## Environment Variables

Create `.env.example` with:

```
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=
SANITY_REVALIDATE_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@preciseaesthetics.com
RESEND_INTERNAL_NOTIFY_EMAIL=demos@preciseaesthetics.com

# Cal.com
NEXT_PUBLIC_CAL_LINK=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Site
NEXT_PUBLIC_SITE_URL=https://preciseaesthetics.com
```

Also commit `.env.local` to `.gitignore`. Do not commit real keys.

## Client Wiring

**Sanity** (`lib/sanity/client.ts`): create read client using project ID, dataset, API version (use today's date), CDN enabled, optional read token for previews.

**Supabase** — two files:
- `lib/supabase/server.ts`: server-only client using service role key. Throw if called from browser.
- `lib/supabase/client.ts`: browser client using anon key.

**Resend** (`lib/resend/client.ts`): single Resend instance from API key. Stub `lib/resend/send.ts` with empty exported functions: `sendDemoConfirmation`, `sendRSVPConfirmation`, `sendLeadWelcome`, `sendInternalDemoNotification` — implementations come in later sessions.

**PostHog**:
- Create `lib/analytics/posthog.ts` with browser init helper.
- Create `components/PostHogProvider.tsx` (client component) that initializes PostHog on mount and wraps children.
- Mount `<PostHogProvider>` in root `layout.tsx`.

**Cal.com**: install `@calcom/embed-react`. No usage this session.

## API Route Stubs

Create the four `/api/*` routes as thin handlers that:
- Accept POST only (return 405 otherwise)
- Parse JSON body
- Validate with a Zod schema (define minimal schemas — full schemas in later sessions)
- Return `{ ok: true }` on success, `{ ok: false, error }` on failure
- Do **not** yet write to Supabase or send emails — implementations come later

`/api/revalidate/route.ts`: validates `SANITY_REVALIDATE_SECRET` against header, calls `revalidateTag` based on body's document type, returns 200.

## Root Layout

In `app/layout.tsx`:
- Apply Fraunces + Inter font variables to `<html>` className
- Set `lang="en"`
- Default metadata: title template `%s — Precise Aesthetics`, default title `Precise Aesthetics — Protocol-Driven Pico Laser`, description from `CLAUDE.md` positioning
- Wrap children in `<PostHogProvider>`
- Add `<Toaster />` from sonner
- Set `<body>` className to `bg-bone-100 text-ink-700 font-body antialiased`

## Marketing Layout

In `app/(marketing)/layout.tsx`:
- Stub a `<Header />` and `<Footer />` component (empty `<header>` / `<footer>` tags with TODO comments — full builds in Session 3)
- Render `{children}` between them

## Placeholder Homepage

`app/(marketing)/page.tsx` should render a single hero section using actual design tokens to verify the wiring works:

- `<section>` with `bg-midnight-800 text-cream-50 min-h-[80vh] flex items-center`
- Container with the brand name in Fraunces (`font-display`), display-xl size
- Subhead in Inter, `--text-lead`, `text-cream-100`
- A small overline label above ("LAUNCHING AUGUST 8, 2026 · CIVIC OPERA BUILDING")
- One button using the locked primary-on-dark style (cream bg, midnight text)

This is a **smoke test** — confirms tokens, fonts, and Tailwind extension all work together. Real homepage comes later.

## Sanity Studio

Mount Studio at `/studio/[[...tool]]/page.tsx` with empty schemas array (`schemaTypes: []`). The Studio should load successfully even with no schemas.

## Verification Steps

Before declaring this session done, run and confirm:

1. `npm run build` passes with zero errors and zero warnings.
2. `npm run dev` boots, homepage renders with Fraunces visible in headline, Inter in subhead, midnight-800 background, cream-50 text.
3. Visiting `/studio` loads Sanity Studio (will be empty, that's fine).
4. All four API routes respond to POST with `{ ok: true }` for valid empty bodies.
5. TypeScript: `npx tsc --noEmit` passes clean.
6. No `any` types anywhere.
7. ESLint: `npm run lint` passes clean.

## Do NOT in This Session

- Do not build Header, Footer, Hero, or any marketing component beyond the smoke-test homepage.
- Do not author Sanity schemas (Session 2).
- Do not implement Supabase tables or RLS (Session 2).
- Do not write email templates (later session).
- Do not add page content beyond the placeholder.
- Do not install Stripe or any payment SDK.

## Deliverables

When done, report back:
1. Output of `npm run build`
2. Output of `npx tsc --noEmit`
3. Confirmation the homepage smoke test renders correctly with Fraunces + Inter + midnight background
4. Any decisions you made that weren't explicit in this prompt or in `CLAUDE.md` / `MASTER.md`
5. Any blockers or missing env vars

Then we move to Session 2: Sanity schemas + Supabase tables.
