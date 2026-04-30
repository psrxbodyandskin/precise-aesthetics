# Session 3 — Design System Base Components

> Run from repo root after Session 2 is complete and the Supabase migration has been applied.

## Context

You have already read `CLAUDE.md`, `design-system/MASTER.md`, `design-system/BRAND-IDENTITY.md`, and `design-system/COPY-DECK.md`. All decisions in those files are binding.

This session builds the **foundational visual primitives** that every subsequent page reuses. Done well here, every page after this is faster and more consistent. Done poorly, every page inherits the drift.

## Goal

Build the brand-layer components that sit on top of shadcn/ui:

- Layout primitives: `<Header>`, `<Footer>`, `<Section>`, `<Container>`
- Typographic primitives: `<Eyebrow>`, `<DisplayHeading>`, `<Heading>`, `<Lead>`, `<BodyText>`
- Brand-styled `<Button>` variants (extending shadcn)
- A `<Logo>` component that handles all four lockup variants
- A `<TrademarkSymbol>` helper for ™ usage rules

No pages yet. No real content. This session ends with a `/sandbox` route that demos every component for visual review.

---

## Critical Constraints

- Read tokens from `MASTER.md` only. Never hardcode hex.
- Tone props (`bone` | `midnight` | `champagne`) drive color logic — components must respond correctly to each.
- All components TypeScript-strict, no `any`.
- Server Components by default. Mark client components explicitly with `"use client"`.
- Accessibility built in from the first component.

---

## Part 1 — Layout Primitives

### 1.1 `<Container>` (`/components/marketing/Container.tsx`)

Server component. Wraps content at the right max-width.

```tsx
type ContainerWidth = "default" | "prose" | "narrow";

interface ContainerProps {
  width?: ContainerWidth;        // default: "default" (1280px)
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "article";
}
```

Widths from MASTER.md:
- `default` → `max-w-[1280px]`
- `prose` → `max-w-[720px]`
- `narrow` → `max-w-[560px]`

Always `mx-auto px-6 md:px-10 lg:px-12`.

### 1.2 `<Section>` (`/components/marketing/Section.tsx`)

Server component. The most-used wrapper.

```tsx
type SectionTone = "bone" | "midnight" | "midnight-deep" | "champagne";
type SectionSize = "compact" | "default" | "hero";

interface SectionProps {
  tone?: SectionTone;             // default: "bone"
  size?: SectionSize;             // default: "default"
  containerWidth?: ContainerWidth; // default: "default"
  eyebrow?: string;               // optional overline label
  className?: string;
  children: React.ReactNode;
  id?: string;                    // for in-page anchors
  as?: "section" | "div";
}
```

Tone → background + text mapping:
- `bone` → `bg-bone-100 text-ink-700`, headings auto inherit `text-ink-900`
- `midnight` → `bg-midnight-500 text-cream-100`, headings inherit `text-cream-50`
- `midnight-deep` → `bg-midnight-800 text-cream-100`, headings inherit `text-cream-50`
- `champagne` → `bg-champagne-200 text-ink-900`, headings inherit `text-ink-900`

Size → vertical padding:
- `compact` → `py-12 md:py-16`
- `default` → `py-20 md:py-32`
- `hero` → `py-32 md:py-40`

If `eyebrow` provided, render `<Eyebrow>` above children with `mb-3 md:mb-4`. Bottom of eyebrow gets a hairline divider — `border-t-0 border-b-0` plus a 60px-wide `1px` line in `brand-500` (or `brand-300` on dark tones), with `mt-6 mb-12 md:mb-14`.

Use a subtle theme context (React context or `data-tone` attribute) so child components like `<Button>` can sense tone.

### 1.3 `<Header>` (`/components/marketing/Header.tsx`)

Client component (needs scroll detection).

Behavior:
- Fixed at top, full-width
- Initial state: transparent background, cream lockup (assumes hero is dark)
- After 24px scroll: solid bone-100 background with subtle bottom border (`border-b border-bone-300/60`), navy lockup, `backdrop-blur-sm`, smooth 220ms transition
- On midnight pages where the hero ISN'T at the top (rare), accept a `defaultTone` prop: `"dark" | "light"` to set initial state

Layout (desktop):
- Left: `<Logo>` linking to `/`
- Right: nav links + primary CTA "Request a demonstration"

Nav (from `COPY-DECK.md`):
```
The System    → /system
Precise Pico  → /pico
Practitioners → /demo
Launch        → /launch
About         → /about
```

Mobile (<768px):
- Hamburger button on right
- Drawer / sheet (use shadcn `Sheet`) opens from right
- Full nav inside, plus CTA at bottom
- Logo stays top-left
- On open: lock body scroll

Active link state: subtle underline (1px, `currentColor`, with `text-underline-offset: 6px`).

CTA button uses the primary midnight variant on bone, primary champagne on midnight when scrolled state inverts.

Accessibility:
- `<header role="banner">`
- Nav inside `<nav aria-label="Main">`
- Skip-to-content link (`sr-only` until focused)
- Mobile menu trapped focus when open
- `aria-expanded`, `aria-controls` on hamburger

### 1.4 `<Footer>` (`/components/marketing/Footer.tsx`)

Server component.

Tone: `midnight-deep` (`bg-midnight-800`).

Layout (desktop, 12-col):
- Cols 1-4: cream `<Logo>` + tagline ("Skin of every shade.") + brief one-liner from siteSettings
- Cols 5-7: Company nav (About, Press, Contact)
- Cols 8-10: System nav (The System, Precise Pico, Practitioners, Launch)
- Cols 11-12: Legal nav (Privacy, Terms, HIPAA Notice)

Below all columns:
- 1px `brand-300/20` divider, full width
- Beneath: small row with `© 2026 PS Medical Aesthetics, LLC. All rights reserved.` on left, social icon links on right (LinkedIn, Instagram, X). Use Lucide icons, `cream-300` color, `cream-100` on hover.
- Trademark line: `Precise Aesthetics™, The Precise System™, Precise Pico™, and PIH Prevention Protocol™ are trademarks of PS Medical Aesthetics, LLC.` — caption size, `cream-300` color.

Mobile: stack columns. Maintain hierarchy.

Pull `companyName`, `tagline`, `socialLinks`, `pressEmail`, `contactEmail` from `siteSettings` via Sanity query (`getSiteSettings`). If query returns null (Studio not yet populated), fall back to constants from `COPY-DECK.md`.

---

## Part 2 — Typographic Primitives

These are tiny components but they enforce the type scale across the site.

All in `/components/marketing/typography/` directory.

### 2.1 `<Eyebrow>`

Overline label.

```tsx
interface EyebrowProps {
  children: React.ReactNode;
  tone?: "auto" | "ink" | "cream";  // auto reads from data-tone context
  className?: string;
  as?: "span" | "p" | "div";
}
```

Renders as: Inter, weight 500, size `--text-overline` (12px), tracking `0.12em`, ALL CAPS via `uppercase` class.

Color logic:
- `auto` → reads section tone; on bone use `brand-500`, on midnight use `brand-300`, on champagne use `midnight-700`
- `ink` → `text-brand-500`
- `cream` → `text-brand-300`

### 2.2 `<DisplayHeading>`

For hero-scale type.

```tsx
interface DisplayHeadingProps {
  level?: "xl" | "lg" | "md";    // default: "lg"
  as?: "h1" | "h2" | "h3";        // default: "h1" for xl, "h2" for lg, "h3" for md
  balance?: boolean;              // default: true (text-balance for visual rhythm)
  className?: string;
  children: React.ReactNode;
}
```

Sizes from MASTER.md type scale:
- `xl` → `text-display-xl`
- `lg` → `text-display-lg`
- `md` → `text-display-md`

Always `font-display` (Fraunces), `font-normal`, `tracking-display`, `leading-display`.
Color inherits from section tone via CSS (don't hardcode).

### 2.3 `<Heading>`

For sub-section heads.

```tsx
interface HeadingProps {
  level: 1 | 2 | 3 | 4;
  as?: keyof JSX.IntrinsicElements;  // override semantic level vs visual level
  className?: string;
  children: React.ReactNode;
}
```

Sizes:
- `1` → `text-h1`
- `2` → `text-h2`
- `3` → `text-h3`
- `4` → `text-h4`

`font-display`, `tracking-heading`, `leading-heading`. Default semantic element matches level (`<h1>` for 1, etc.) unless `as` overrides.

### 2.4 `<Lead>`

Hero subheadline / section intro paragraph.

```tsx
interface LeadProps {
  className?: string;
  children: React.ReactNode;
}
```

`text-lead`, `font-body`, `leading-body`, `max-w-[58ch]`.

### 2.5 `<BodyText>`

Standard body paragraph.

```tsx
interface BodyTextProps {
  size?: "default" | "small";    // default: "default"
  className?: string;
  children: React.ReactNode;
}
```

Default → `text-body`, `leading-body`, `max-w-[68ch]`.
Small → `text-small`, `leading-body`.

### 2.6 `<TrademarkSymbol>`

Tiny helper: renders ™ with proper inline styling (no superscript, full size, slight letter-spacing buffer).

```tsx
<TrademarkSymbol />  // outputs <sup class="..."> ™ </sup> equivalent — but per BRAND-IDENTITY.md, NOT superscript. Inline with word at full size.
```

Implementation: a `<span>` with `aria-hidden="true"` set to `false` (so screen readers read "trademark"), no font-size shrink, slight `ml-[0.05em]`.

---

## Part 3 — Button Component (extend shadcn)

Replace the default shadcn `Button` with a brand-aware version at `/components/ui/button.tsx`.

```tsx
type ButtonVariant =
  | "primary"          // midnight-800 bg, cream-50 text, on bone
  | "primary-on-dark"  // cream-50 bg, midnight-800 text, on midnight
  | "secondary"        // transparent bg, midnight-500 border, on bone
  | "secondary-on-dark"// transparent bg, cream-100 border, on midnight
  | "champagne"        // champagne-200 bg, midnight-800 text — luxury moments only
  | "ghost"            // text only, hover bg
  | "ghost-on-dark";

type ButtonSize = "sm" | "md" | "lg";  // h-9, h-11, h-13
```

Sizes from MASTER.md:
- `sm` → `h-9 px-4 text-sm`
- `md` → `h-11 px-6 text-body`
- `lg` → `h-13 px-8 text-lead`

All variants:
- `font-body` Inter, weight 500
- `tracking-[-0.005em]`
- `rounded-md` (8px from MASTER.md)
- 150ms ease-out transition on color/background
- Visible focus ring using `--pa-focus-ring`
- `aria-busy` + spinner support for `loading` prop
- `disabled:opacity-50 disabled:cursor-not-allowed`

Composition: support `asChild` pattern (Radix Slot) so `<Button asChild><Link>...</Link></Button>` works.

---

## Part 4 — `<Logo>` Component

`/components/marketing/Logo.tsx` — server component.

```tsx
type LogoVariant = "horizontal" | "monogram-circle" | "monogram";
type LogoTone = "auto" | "cream" | "navy" | "black" | "white";

interface LogoProps {
  variant?: LogoVariant;          // default: "horizontal"
  tone?: LogoTone;                // default: "auto" — reads from data-tone context
  width?: number;                 // pixel width, defaults per variant
  href?: string;                  // wraps in Link if provided; default: "/"
  className?: string;
  priority?: boolean;             // for next/image priority
}
```

Logic:
- `tone="auto"` reads section tone:
  - `bone` / `champagne` → uses `navy` variant
  - `midnight` / `midnight-deep` → uses `cream` variant
- Renders the corresponding SVG from `public/brand/`:
  - horizontal + cream → `precise-aesthetics-horizontal-cream.svg`
  - horizontal + navy → `precise-aesthetics-horizontal-navy.svg`
  - horizontal + black → `precise-aesthetics-horizontal-black.svg`
  - horizontal + white → `precise-aesthetics-horizontal-white.svg`
  - monogram-circle + cream → `precise-aesthetics-monogram-circle-dark.svg`
  - monogram-circle + navy → `precise-aesthetics-monogram-circle-light.svg`
  - monogram + cream → `precise-aesthetics-monogram-cream.svg`
  - monogram + navy → `precise-aesthetics-monogram-navy.svg`

Use `next/image` for SVG rendering. Add `alt="Precise Aesthetics"` always. Width defaults: `horizontal` 200px, `monogram-circle` 48px, `monogram` 56px.

If `href` provided, wrap in `<Link>` with `aria-label="Precise Aesthetics — home"`.

---

## Part 5 — Sandbox Route (visual review)

Create `/app/(marketing)/sandbox/page.tsx` (no link from anywhere in nav — discovery via direct URL).

This page demos every component built this session, in every relevant variant. Sections to include:

1. **Section tone matrix** — one `<Section>` per tone, each with eyebrow + display heading + lead + button
2. **Typography scale** — every text primitive at every size, on bone and on midnight
3. **Button matrix** — every variant × every size × default/hover/disabled/loading states
4. **Logo matrix** — every variant × every tone, on bone and midnight backgrounds
5. **Eyebrow tone test** — shows auto color responding to section tone
6. **Trademark symbol test** — shows ™ inline placement

Add a small note at the top: "Internal sandbox for design system review. Not linked from production navigation."

This page won't ship to prod long-term but lives in the repo. Add a comment in the file noting it's for review.

---

## Part 6 — Layouts

### 6.1 Update `/app/(marketing)/layout.tsx`

```tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
```

Skip-to-content link in root layout (above Header).

### 6.2 Verify root layout

`/app/layout.tsx` already has fonts, PostHog, Toaster from Session 1. Confirm:
- `<html lang="en">` present
- Both font CSS variables on `<html>` className
- `<body className="bg-bone-100 text-ink-700 font-body antialiased">`
- Sonner `<Toaster />` present

---

## Part 7 — Verification

Before declaring this session done:

1. `npm run build` passes clean
2. `npx tsc --noEmit` passes clean
3. `npm run lint` passes clean
4. Visit `/sandbox` — every component renders correctly across all variants
5. Resize browser to 375 / 768 / 1024 / 1440 — every component responsive
6. Tab through `/sandbox` keyboard-only — focus visible everywhere, no traps
7. Toggle prefers-reduced-motion in DevTools — no animation runs
8. Lighthouse on `/sandbox` — accessibility 100, performance 95+
9. Manually test Header on a placeholder page with both dark and light heroes — scroll behavior + tone detection works

---

## Pre-Delivery Checklist (from MASTER.md)

For every component built this session:
- [ ] Reads from MASTER.md tokens only — no arbitrary hex
- [ ] TypeScript strict, no `any`
- [ ] Responsive at 375 / 768 / 1024 / 1440
- [ ] Keyboard accessible
- [ ] Focus visible on every interactive element
- [ ] prefers-reduced-motion respected
- [ ] Touch targets ≥ 44 × 44px on interactive elements
- [ ] Body text contrast ≥ 4.5:1
- [ ] No console errors or warnings
- [ ] Loading + disabled states present where applicable
- [ ] Semantic HTML (correct heading levels, landmarks)
- [ ] Server Components by default; client only where needed
- [ ] Lucide icons only, correct stroke width

---

## Do NOT in This Session

- Do not build any real marketing pages (homepage, /system, /pico, etc. — those are Sessions 4+)
- Do not build forms (Sessions 4+)
- Do not implement Cal.com embed (Session 11)
- Do not build the practitioner portal UI (later session)
- Do not change the design tokens in MASTER.md or `globals.css` — they are locked
- Do not introduce new fonts or icon libraries

---

## Deliverables

When done, report back:
1. List of every component built with file path
2. `/sandbox` URL working in dev — confirm visually via screenshot if helpful
3. Build, lint, type-check all green
4. Any decisions made not explicit in this prompt
5. Any blockers

Then we move to Session 4: the teaser landing page (ship to production, start capturing emails immediately).
