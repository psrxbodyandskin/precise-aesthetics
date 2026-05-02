# Session 8 — /about Page

> Run from repo root. Builds /about as a document — long-form editorial essay, no imagery, no CTAs, pure typography.

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/SYSTEM-MANIFESTO-FINAL-V2.md` (register reference)
6. `spec/ABOUT-DOCUMENT-FINAL-V2.md` (locked copy — verbatim)
7. This spec

**Visual reference:** the homepage and /system manifesto page as currently shipped. /about extends the same editorial register but at deeper restraint — fewer visual elements, more whitespace, typography-only.

---

## What Gets Built

| Route | Purpose |
| --- | --- |
| `/about` | Document-style page. Long-form essay. No imagery, no CTAs. |

**Out of scope:** /contact (future), press, careers, any team or personality content.

---

## Concept

`/about` is not a marketing page. It is a published document about why the company exists.

- One continuous bone-100 surface, top to bottom — no section tone changes
- Single-column, max-w-[680px], generous margin
- Typography only — no imagery, no diagrams, no cards, no callouts
- No CTAs in the page body
- Footer of the document has three quiet text links (/system, /pico, /launch) — that is the entire navigational surface inside the page
- Site Header and Footer chrome stay normal

**Reference register:** Aesop's About. Loro Piana essays. New Yorker opinion typography.

---

## Constraints

1. **Document copy verbatim from `ABOUT-DOCUMENT-FINAL-V2.md`.** No paraphrasing, no edits, no "improvements."
2. **MASTER.md tokens only.** No new colors, fonts, icons.
3. **No imagery.** Single allowed visual element: an optional `§ Fig. 00` annotation in one corner. Otherwise typography stands alone.
4. **No CTAs in the page body.** No buttons, no demo links, no email capture.
5. **System-first voice.** "We" appears here because documents need speakers. Same exception as /system manifesto.
6. **No new visual primitives required.** This page composes from existing typography. If you reach for a new component, you are over-building.
7. **Lighthouse 100 across the board possible.** Server Component, no JavaScript, no images, minimal CSS. Aim for it.

---

## Page Structure (6 moments)

### 1 — Page Title

```
[Eyebrow, Inter overline, tracked 0.18em, ink-500]
§ ON THE COMPANY

[Display heading, Fraunces, oversized, two lines, italic on second]
A document on
why we exist.
```

Display heading: Fraunces 96-120px desktop, 56-72px mobile, weight 400, italic only on "why we exist.", line-height 0.95-1.0, letter-spacing -0.02em, color ink-900.

Generous top + bottom padding around the title block.

### 2 — Opening Passage

```
This is the company in its own words. The reasons we exist. The 
patients we built this for. The standard we hold.

Read it as a document, not a brochure.
```

Render slightly larger than body prose — Inter 22px desktop / 19px mobile, ink-700, line-height 1.7. Sets voice before numbered sections begin.

### 3 — Section Dividers

Between numbered sections (I, II, III):
- 60px wide
- 1px brand-300 hairline at 30% opacity
- Centered horizontally
- py-16 desktop / py-12 mobile

The only non-typography visual on the page. Paces the document.

### 4 — Numbered Sections

Three sections from the document copy:

- I. The patients we built this for.
- II. What we believe.
- III. The standard.

Each section:

**Heading block:**
- Roman numeral + period in Inter overline above (small, ink-500, tracked 0.18em)
- Section title in Fraunces 32-36px desktop / 28-32px mobile, weight 400, ink-900, line-height 1.15

**Body prose:**
- Inter 19-20px desktop / 17-18px mobile
- weight 400, ink-700, line-height 1.7
- Paragraph spacing: 1.2em between paragraphs

**Italicized pivot lines** (per the document):
- Section I: "We built the system for the patients first."
- Section I close: "It is the engineering brief."
- Section III close: "The standard does not move."

Render as italic Fraunces at body size (NOT promoted to display). Own line, mt-6 above and below. Treat as paragraph emphasis, not section breaks.

**No bullet lists, no callouts, no cards.** Continuous prose only.

### 5 — Footer of the Document

After Section III, a final divider, then:

```
[Eyebrow, Inter overline, ink-500, centered]
§ END OF DOCUMENT

[Three quiet text links, Inter 14px, ink-700, hover ink-900]
The architecture → /system
The instrument → /pico
The launch → /launch
```

Layout:
- Vertical stack on mobile
- Horizontal row on desktop (centered, generous spacing between)
- Arrow uses Inter character →, not Lucide icon
- Hover: color shift only, 150ms ease-out, no underline animation

**No buttons in this footer.** The links are the entire navigational closure.

### 6 — Optional Fig. Annotation

A small `§ Fig. 00` annotation in one corner (top-right or bottom-left, your choice). Same treatment as Fig. annotations on homepage and /system. Include if it adds editorial weight, omit if it feels superfluous.

---

## Layout

**Container:**
- max-w-[680px], mx-auto
- px-6 mobile / px-12 desktop
- py-32 desktop / py-20 mobile

**Background:**
- bone-100 (#FAF7F2 — never pure white)
- Same subtle gradient/grain treatment used on homepage bone sections
- One continuous surface, no section tone changes

**Vertical rhythm:**
- Generous space between title and opening passage (mt-24)
- Generous space between opening and Section I (mt-32)
- Section dividers (60px hairline) pace between sections
- Generous space before End of Document footer (mt-32)
- Generous space after footer before page bottom (mb-32)

This page is meant to feel sparse. Whitespace is the design.

---

## Metadata

```typescript
export const metadata: Metadata = {
  title: "About — Precise Aesthetics",
  description:
    "A document on why we exist. The patients we built this for, what we believe, and the standard we hold.",
  openGraph: {
    title: "About — Precise Aesthetics",
    description:
      "A document on why we exist.",
    url: "https://preciseaesthetics.com/about",
    type: "article",
  },
  alternates: {
    canonical: "https://preciseaesthetics.com/about",
  },
};
```

OG image: use the existing /og route default. No custom OG image needed for this page.

---

## Verification

1. `npm run build` clean
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Visit /about:
   - Document copy renders verbatim from ABOUT-DOCUMENT-FINAL-V2.md
   - Three numbered sections, three dividers, end-of-document footer
   - Italicized pivot lines render as italic Fraunces at body size
   - No imagery, no buttons, no decorative elements except the optional Fig. annotation
5. Three footer links resolve correctly (/system, /pico, /launch)
6. Lighthouse on production build — aim for 100 across all metrics
7. Keyboard nav: tab through, three footer links reachable, focus visible
8. Reduced motion: nothing to test, no motion on this page

---

## Pre-Delivery Checklist

- [ ] Tokens-only
- [ ] Document copy verbatim (no edits to copy)
- [ ] No new fonts/icons/colors/components
- [ ] Console clean
- [ ] System-first voice ("we" appears intentionally per the document)
- [ ] No personalities anywhere
- [ ] No imagery anywhere
- [ ] No CTAs in body
- [ ] Italicized pivot lines correct
- [ ] Section dividers correct
- [ ] Lighthouse 95+ minimum, 100 target

---

## Deliverables

When done, report:
1. Production preview URL for /about
2. Lighthouse scores
3. Confirmation copy renders verbatim from the locked document
4. Any decisions made not explicit in this prompt
5. Any blockers
