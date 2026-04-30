# Precise Aesthetics — Master Design System

> Single source of truth. Read before generating any UI.
> Page-specific overrides live in `design-system/pages/[page-name].md`.

## Brand Soul

**Pattern:** Editorial Authority + Trust-Driven Conversion
**Style:** Modern Editorial × Clinical Premium (Stripe-meets-NEJM, with Aesop warmth)
**Mood:** Confident, calm, premium, distinctly non-clinical-but-earned-clinical

**Reference brands:** Stripe (clarity), Linear (craft), Aesop (warmth),
NEJM (authority), Equinox (premium restraint).

**Anti-patterns (NEVER):**
- Generic teal/cyan medical device aesthetic
- AI purple/pink gradients
- Stock photos of women touching their faces
- Carousels on the homepage
- Bullet-point feature grids without hierarchy
- Pure white backgrounds (use bone)
- Drop shadows everywhere (use 2 shadow levels max)
- Emoji as icons (Lucide only)
- Auto-playing video
- Animations on scroll for everything (only on hero + intentional moments)

---

## Color Tokens

All colors as CSS variables in `globals.css`. Never use arbitrary hex.

### Primitives

```css
:root {
  /* Midnight — primary dark */
  --pa-midnight-50:  #EEF1F7;
  --pa-midnight-100: #D4DCEA;
  --pa-midnight-200: #A8B6CF;
  --pa-midnight-300: #6F82A6;
  --pa-midnight-400: #3F567F;
  --pa-midnight-500: #1F2F4F;  /* Primary navy — hero backgrounds */
  --pa-midnight-600: #182542;
  --pa-midnight-700: #121C33;
  --pa-midnight-800: #0C1426;  /* Deepest navy — luxury moments */
  --pa-midnight-900: #070C18;

  /* Brand Blue — from logo, accent + interactive */
  --pa-blue-50:  #F2F7FC;
  --pa-blue-100: #E0ECF7;
  --pa-blue-200: #C2D9EF;
  --pa-blue-300: #A8C8E8;  /* Logo blue — primary brand accent */
  --pa-blue-400: #7FAEDB;
  --pa-blue-500: #5891CA;
  --pa-blue-600: #3D74AE;
  --pa-blue-700: #2B5688;
  --pa-blue-800: #1F3F65;
  --pa-blue-900: #152B47;

  /* Champagne — warm luxury accent (use sparingly) */
  --pa-champagne-50:  #FBF8F1;
  --pa-champagne-100: #F4ECD9;
  --pa-champagne-200: #E8DCC4;  /* Primary champagne */
  --pa-champagne-300: #D9C9A8;
  --pa-champagne-400: #C5B187;
  --pa-champagne-500: #A89366;
  --pa-champagne-600: #87764F;

  /* Bone — warm neutral background (NEVER pure white) */
  --pa-bone-50:  #FDFCF9;
  --pa-bone-100: #FAF7F2;  /* Primary background */
  --pa-bone-200: #F2EDE3;
  --pa-bone-300: #E5DDCC;

  /* Ink — text colors */
  --pa-ink-900: #0A0F1C;  /* Headlines on bone */
  --pa-ink-700: #1F2A3D;  /* Body on bone */
  --pa-ink-500: #4A5568;  /* Muted on bone */
  --pa-ink-300: #8B95A7;  /* Captions on bone */

  /* On-dark text */
  --pa-cream-50:  #FDFCF9;  /* Headlines on midnight */
  --pa-cream-100: #F4F0E8;  /* Body on midnight */
  --pa-cream-300: #C9C2B5;  /* Muted on midnight */

  /* Semantic */
  --pa-success: #2D7A4F;
  --pa-warning: #B8862F;
  --pa-error:   #B23B3B;
  --pa-info:    var(--pa-blue-500);

  /* Surfaces */
  --pa-surface-bone:        var(--pa-bone-100);
  --pa-surface-bone-raised: var(--pa-bone-50);
  --pa-surface-midnight:    var(--pa-midnight-500);
  --pa-surface-midnight-deep: var(--pa-midnight-800);
  --pa-surface-elevated:    #FFFFFF;  /* Cards on bone only */

  /* Borders */
  --pa-border-subtle:  rgba(10, 15, 28, 0.08);
  --pa-border-default: rgba(10, 15, 28, 0.14);
  --pa-border-strong:  rgba(10, 15, 28, 0.24);
  --pa-border-on-dark-subtle:  rgba(244, 240, 232, 0.10);
  --pa-border-on-dark-default: rgba(244, 240, 232, 0.18);

  /* Focus ring */
  --pa-focus-ring: 0 0 0 3px rgba(168, 200, 232, 0.5);
}
```

### Tailwind Theme Extension

```ts
// tailwind.config.ts — extend.colors
colors: {
  midnight: { 50:'var(--pa-midnight-50)', /* ...through 900 */ },
  brand:    { 50:'var(--pa-blue-50)',     /* ...through 900 */ },
  champagne:{ 50:'var(--pa-champagne-50)',/* ...through 600 */ },
  bone:     { 50:'var(--pa-bone-50)',     /* ...through 300 */ },
  ink:      { 300:'var(--pa-ink-300)', 500:'var(--pa-ink-500)', 700:'var(--pa-ink-700)', 900:'var(--pa-ink-900)' },
  cream:    { 50:'var(--pa-cream-50)', 100:'var(--pa-cream-100)', 300:'var(--pa-cream-300)' },
}
```

### Color Usage Rules

- **Default page background:** `bone-100` (NEVER pure white)
- **Hero / luxury sections:** `midnight-500` or `midnight-800`
- **Primary CTA:** `midnight-800` bg, `cream-50` text — OR `champagne-200` bg, `midnight-800` text for premium moments
- **Secondary CTA:** ghost with `midnight-500` border, `midnight-500` text
- **Body text on bone:** `ink-700`
- **Body text on midnight:** `cream-100`
- **Brand blue (`brand-300`):** sparingly — links, focus rings, accent strokes, the system diagram
- **Champagne:** RARE — launch event RSVP CTA, "Invitation Only" badge, key trademark moments
- **Contrast:** body text 4.5:1 minimum, large text 3:1 minimum, always.

### Color Pairings (canonical)

- **Eyebrow on bone:** `brand-700` (`#2B5688`) — passes AA on bone-100 (~8:1). Brand-blue accent retained, but darkened from brand-500 which fails contrast.
- **Eyebrow on midnight / midnight-deep:** `brand-300` (`#A8C8E8`) — logo blue, passes AA on midnight backgrounds.

---

## Typography

### Fonts (next/font, self-hosted)

```ts
// app/layout.tsx
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

### Type Scale

```css
:root {
  --font-display: var(--font-display), 'Fraunces', Georgia, serif;
  --font-body:    var(--font-body), 'Inter', -apple-system, sans-serif;

  /* Display — Fraunces, opsz 144, SOFT 50, WONK 0 */
  --text-display-xl: clamp(3.5rem, 6vw + 1rem, 6.5rem);  /* Hero */
  --text-display-lg: clamp(2.75rem, 4vw + 1rem, 4.75rem);
  --text-display-md: clamp(2.25rem, 3vw + 1rem, 3.5rem);

  /* Headings — Fraunces, opsz 36 */
  --text-h1: clamp(2rem, 2.5vw + 1rem, 3rem);
  --text-h2: clamp(1.625rem, 1.5vw + 1rem, 2.25rem);
  --text-h3: 1.5rem;
  --text-h4: 1.25rem;

  /* Body — Inter */
  --text-lead: 1.25rem;     /* Hero subtitle, intro paragraph */
  --text-body: 1.0625rem;   /* Default body */
  --text-small: 0.9375rem;
  --text-caption: 0.8125rem;
  --text-overline: 0.75rem; /* All-caps labels, tracking 0.12em */

  /* Line heights */
  --leading-display: 1.05;
  --leading-heading: 1.15;
  --leading-body:    1.6;
  --leading-tight:   1.3;

  /* Letter spacing */
  --tracking-display: -0.02em;
  --tracking-heading: -0.015em;
  --tracking-body:    0;
  --tracking-overline: 0.12em;
}
```

### Typography Usage Rules

- **Display + headings:** Fraunces, weight 400-500. Avoid 700+ (loses elegance).
- **Body:** Inter, weight 400 default, 500 for emphasis, 600 for buttons.
- **All-caps labels:** Inter 500, tracking 0.12em, size `--text-overline`. Use for section labels, badges, "INVITATION ONLY."
- **Trademark symbols (™):** always inline with the word, no superscript wrap.
- **Line length:** body copy max-width 65ch. Display max-width 18ch for headlines.
- **No center-aligned body copy.** Headlines can center on hero only.

---

## Spacing & Layout

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;  /* Section vertical rhythm desktop */
  --space-40: 160px;  /* Hero vertical rhythm */

  --container-max: 1280px;
  --container-prose: 720px;
  --container-narrow: 560px;
}
```

### Layout Rules

- **Section vertical padding:** `py-20` mobile, `py-32` desktop. Hero: `py-32` mobile, `py-40` desktop.
- **Container:** `max-w-[1280px] mx-auto px-6 md:px-10 lg:px-12`
- **Grid:** 12-col on desktop, 6 on tablet, 4 on mobile. Use CSS grid, not flexbox, for page-level layout.
- **Component spacing:** prefer 8px increments. Avoid 5, 7, 11, 13, etc.

---

## Radii, Shadows, Borders

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 20px;
  --radius-2xl: 32px;
  --radius-full: 9999px;

  /* Two shadow levels MAX. Never stack drop shadows. */
  --shadow-soft:  0 1px 2px rgba(10,15,28,.04), 0 4px 12px rgba(10,15,28,.04);
  --shadow-lift:  0 2px 4px rgba(10,15,28,.06), 0 12px 32px rgba(10,15,28,.08);

  /* On dark — use border, not shadow */
  --border-on-dark: 1px solid var(--pa-border-on-dark-subtle);
}
```

- Cards on bone: `--shadow-soft`, `--radius-lg`
- Modals/elevated: `--shadow-lift`, `--radius-xl`
- Cards on midnight: NO shadow, use `--border-on-dark` instead
- Buttons: `--radius-md`
- Pills/badges: `--radius-full`

---

## Motion

```css
:root {
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --duration-fast: 150ms;
  --duration-base: 220ms;
  --duration-slow: 400ms;
  --duration-deliberate: 700ms;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Motion Rules

- **Hover:** 150ms ease-out. Color/opacity/transform only. Never animate size of layout elements.
- **Page entrance:** hero + first fold can have ONE deliberate animation (e.g., headline fade+rise 700ms). Below the fold = no scroll animations except for the System Diagram and Treatment Flow which are intentional.
- **Framer Motion:** allowed for system diagram, treatment flow, launch countdown, modals. Forbidden for: every section "fading in on scroll," text reveals on every paragraph, parallax decoration.
- **Always honor `prefers-reduced-motion`.**

---

## Components (shadcn baseline + brand layer)

### Button
Variants:
- primary    → bg midnight-800, text cream-50, hover midnight-700
- secondary  → bg transparent, border 1.5px midnight-500, text midnight-800, hover bg midnight-50
- champagne  → bg champagne-200, text midnight-800, hover champagne-300 (luxury moments only)
- ghost      → text midnight-700, hover bg midnight-50
- on-dark    → bg cream-50, text midnight-800, hover cream-100

Sizes: sm (h-9 px-4), md (h-11 px-6), lg (h-13 px-8)
Radius: --radius-md
Font: Inter 500, tracking -0.005em
Focus: --pa-focus-ring
Loading state: spinner + disabled, never spinner alone

### Section
Wrapper component with:
- tone prop: 'bone' | 'midnight' | 'midnight-deep'
- size prop: 'compact' | 'default' | 'hero'
- Auto applies correct text colors, vertical padding, and container
- Optional eyebrow label (overline style)
- Optional kicker (italic Fraunces line above headline)

### Card
- On bone: bg cream-50/elevated, border-subtle, --shadow-soft, --radius-lg
- On midnight: bg midnight-700, border-on-dark-subtle, NO shadow, --radius-lg
- Padding: 24px mobile, 32px desktop

### Form Inputs
- Height: 44px (touch target minimum)
- Border: 1.5px border-default, focus → 1.5px brand-400 + focus ring
- Background: cream-50 on bone pages, midnight-700 on midnight pages
- Radius: --radius-md
- Label: overline style, ink-700 on bone, cream-100 on midnight
- Error: error color + 1.5px error border + helper text below

### Badge
- Default: bg midnight-50, text midnight-700, --radius-full, overline type
- Champagne (premium): bg champagne-100, text midnight-800
- On-dark: bg midnight-700, text cream-100, border-on-dark-subtle

---

## Iconography

- **Lucide React only.** No emoji as icons. No mixed icon libraries.
- Stroke width: 1.5 default, 1.75 for hero.
- Size scale: 16, 20, 24, 32.
- Color inherits from text color. No brand-blue icons unless intentional accent.

---

## Imagery

- **Before/after:** always paired, same crop, same lighting, labeled with session count + Fitzpatrick type. `consentObtained=true` required in Sanity.
- **Photography style (when shot):** natural light, real practitioners, real patients, clinical environments without sterility. Avoid stock-photo gloss.
- **Sanity image CDN:** always use `urlFor()` with `auto: 'format'` and explicit width.
- **next/image:** required everywhere. Never `<img>`.
- **Alt text:** required field in Sanity. No empty alt unless purely decorative.

---

## Accessibility (WCAG AA Minimum)

- Color contrast: body 4.5:1, large text 3:1
- Focus visible on every interactive element (use `--pa-focus-ring`)
- Keyboard navigation tested on every page
- Screen reader: semantic HTML, ARIA only when semantics insufficient
- Skip-to-content link at top of body
- Form errors: aria-invalid + aria-describedby
- Motion: respect `prefers-reduced-motion`
- Heading hierarchy: one h1 per page, no skipping levels

---

## SEO & Metadata Defaults

- Default `<title>` pattern: `{Page} — Precise Aesthetics`
- Homepage exception: `Precise Aesthetics — Protocol-Driven Pico Laser`
- Meta description: 140-160 chars, sentence case, no marketing fluff
- OG image: 1200×630, generated per-page (Vercel OG)
- Structured data: Organization, MedicalProcedure (protocols), Event (launch)
- Canonical URLs always set
- Sitemap auto-generated, submitted to GSC

---

## Pre-Delivery Checklist

Before declaring any UI "done," verify ALL:

- [ ] All colors from MASTER tokens (no arbitrary hex)
- [ ] Fraunces for display/headings, Inter for body/UI — no other fonts
- [ ] Spacing on 8px grid
- [ ] Two shadow levels max, used correctly (bone vs midnight)
- [ ] Lucide icons only, correct stroke width
- [ ] Hover states with 150ms ease-out transitions
- [ ] Focus visible on every interactive element
- [ ] Touch targets ≥ 44px
- [ ] Responsive: 375 / 768 / 1024 / 1440 verified
- [ ] Body text contrast ≥ 4.5:1
- [ ] `prefers-reduced-motion` respected
- [ ] No console errors or warnings
- [ ] Loading + error + empty states present
- [ ] Lighthouse 95+ (mobile + desktop)
- [ ] No pure white backgrounds (bone-100 default)
- [ ] No emoji as icons, no AI gradient clichés, no carousels on home
- [ ] All images have alt text
- [ ] All forms validated with Zod, errors accessible
- [ ] If on midnight: no shadows, use borders
- [ ] If using champagne: justified by premium/luxury context only

---

## Hierarchical Override Pattern

When building a specific page:
1. Read this MASTER.md first.
2. Check if `design-system/pages/[page-slug].md` exists.
3. If yes, page rules override Master where they conflict.
4. If no, use Master exclusively.

Example: `design-system/pages/launch.md` may extend champagne usage and add countdown-specific motion rules.
