# Precise Aesthetics — Brand Identity System

**Version 1.0 — April 2026**
**Owner:** PS Medical Aesthetics, LLC
**Domain:** preciseaesthetics.com
**Launch:** August 8, 2026 — Civic Opera Building Rooftop, Chicago

---

## How to Use This Document

This is the brand identity system. It defines who we are, what we sound like, and how we look — across every surface, from the website to the launch event signage to a Slack DM.

- For **technical design tokens** (CSS variables, Tailwind config, component specs), see `design-system/MASTER.md`. That file is the implementation source of truth.
- For **brand strategy, voice, and visual direction**, this document is the source of truth.
- When the two conflict, MASTER.md wins for code, this wins for brand.

If you're producing anything with the Precise Aesthetics name on it — site, deck, post, signage, email signature, business card — start here.

---

## 1. Brand Strategy

### 1.1 What We Are

Precise Aesthetics is a clinical technology company advancing dermatologic outcomes through engineering, protocol, and data. Our flagship system, Precise Pico™, is a protocol-driven pico laser engineered to deliver predictable results across every Fitzpatrick skin type.

We are owned and operated by PS Medical Aesthetics, LLC.

### 1.2 What We Are Not

We are not a medspa. We are not a consumer beauty brand. We are not a generic device manufacturer. We do not sell direct-to-consumer.

### 1.3 Mission

To establish a new standard in laser dermatology — one in which outcomes are predictable, protocols are scalable, and safety on darker skin is engineered, not improvised.

### 1.4 Vision

A world where every patient, regardless of skin tone, has access to laser dermatologic care that works.

### 1.5 Core Values

**Precision.** Every parameter, every protocol, every claim is grounded in measurement.
**Equity.** Skin of every shade. We engineer for the patients other systems fail.
**Authority.** Clinical expertise leads our work. Marketing supports it. Never the other way around.
**Restraint.** Less, said better. We earn trust through what we don't say as much as what we do.
**Iteration.** Real-world data is the loop that makes the system smarter.

### 1.6 Brand Promise

**Predictable outcomes across every skin type.**

This sentence is the contract we sign with every practitioner who buys our system. Everything else in the brand serves this promise.

---

## 2. Brand Architecture

### 2.1 Architecture Diagram

```
PS Medical Aesthetics, LLC                    [Legal entity]
└── Precise Aesthetics™                       [Master brand / company / website]
    ├── Precise Pico™                         [Flagship product — pico laser system]
    │   ├── Precise Pico Device
    │   ├── PIH Prevention Protocol™
    │   ├── Protocol Library                  [Gated, proprietary]
    │   └── Practitioner Portal
    ├── Precise Skin (working name)           [Treatment kits — Phase 2]
    └── Future products                       [Precise RF, Precise IPL, etc.]
```

### 2.2 Naming Rules

- **PS Medical Aesthetics, LLC** — used only in legal copy: Terms of Service, Privacy Policy, copyright lines, regulatory documents, contracts, invoices.
- **Precise Aesthetics** — used in all marketing, the website, social, press, and event communications. This is the brand the world sees.
- **Precise Pico™** — used when referring to the flagship device. Always with the trademark symbol on first appearance per page or document.
- **PIH Prevention Protocol™** — always with trademark symbol on first appearance.
- **Protocol Library** — capitalized when referring to ours specifically.

### 2.3 Trademark Usage

Mark with ™ on first appearance in any document or page. Subsequent appearances within the same document do not need ™.

In legal/contractual contexts, full attribution: *"Precise Aesthetics™ and Precise Pico™ are trademarks of PS Medical Aesthetics, LLC."*

---

## 3. Voice and Tone

### 3.1 Voice Pillars

Our voice is **clinically authoritative, editorially restrained, and quietly premium**. Three pillars:

**Authoritative.** We sound like clinicians who happen to be excellent at branding, not marketers pretending to be clinicians. We cite. We measure. We refuse to overpromise.

**Restrained.** We say less than we could. The brands we admire — Aesop, Stripe, NEJM — all share a discipline of leaving white space in language. We do too.

**Warm.** Authority without warmth is corporate. Restraint without warmth is cold. We are competent and human.

### 3.2 Tone Modulation

Our voice is consistent. Our tone shifts by context.

| Context | Tone |
| --- | --- |
| Homepage hero | Confident, declarative, single-sentence thesis |
| Protocol pages | Clinical, precise, data-led |
| Demo request follow-up | Warm, professional, genuinely helpful |
| Launch invitation | Refined, anticipatory, scarce-feeling |
| Practitioner support email | Direct, problem-solving, no fluff |
| Social post | Editorial, image-led, single line of text |
| Internal comms | Plain, no jargon, get-to-the-point |

### 3.3 What We Sound Like

**Yes:**
- "Predictable outcomes across every skin type."
- "Engineered for safety on Fitzpatrick I–VI."
- "The protocol leads. The laser follows."
- "A new standard in laser dermatology."
- "Skin of every shade."

**No:**
- "Revolutionary breakthrough in skin rejuvenation!" *(too marketing)*
- "Unleash your skin's true potential" *(consumer-y, vague)*
- "Industry-leading proprietary technology" *(jargon, brag)*
- "World-class results you can trust" *(empty claim)*
- "Game-changing innovation" *(reflexive cliché)*

### 3.4 Copywriting Rules

1. **One idea per sentence.** If a sentence has two clauses joined by "and," consider splitting.
2. **Lead with the verb.** "Engineered for…" beats "We have engineered…"
3. **Numbers earn trust.** Replace "many" with "247." Replace "fast" with "in under 2 minutes."
4. **Cut hedge words.** "Just," "really," "very," "actually," "basically." Remove them all.
5. **No exclamation points** outside of internal Slack and friendly support emails.
6. **No emoji** in marketing copy. Sparingly in support emails if the team voice already includes them.
7. **Sentence case headlines.** Not Title Case. Not ALL CAPS. (ALL CAPS reserved for tracked overlines like CLINICAL TECHNOLOGY.)
8. **Oxford comma:** yes.
9. **Em dashes (—)** with no surrounding spaces for asides. Not hyphens with spaces.
10. **Curly quotes (" ")** in body copy, never straight (" ").

### 3.5 Words We Use

Pico. Protocol. Predictable. Outcome. Indication. Fitzpatrick. Practitioner. Clinical. Endpoint. Fluence. Wavelength. Engineered. System. Library. Standard.

### 3.6 Words We Avoid

Revolutionary. Game-changing. Cutting-edge. World-class. Innovative (overused — show, don't tell). Unleash. Transform (use sparingly). Experience (as in "the X experience"). Solution. Leverage (verb). Synergy. Empower. Disrupt.

### 3.7 The "Fifth-Grader Test" — But Inverted

Most brand voice guides say "write so a fifth grader can understand it." We say the opposite for our protocol content: **write so a board-certified dermatologist respects it**. Use the technical terms. Cite the studies. Trust the practitioner reader. Plain-language explanations belong on consumer-facing brands. We are B2B. Sophistication is the table stakes.

---

## 4. Messaging Architecture

### 4.1 The One-Liner

**Predictable outcomes across every skin type.**

This is the line that goes on the homepage hero, in press boilerplate, in elevator pitches, on conference badges. It does not change.

### 4.2 The 30-Second Pitch

> Precise Aesthetics is a clinical technology company advancing dermatologic care through engineering and data. Our flagship system, Precise Pico™, pairs a multi-wavelength pico laser with the PIH Prevention Protocol™ — a proprietary clinical framework engineered for safety on darker skin. We launch August 8, 2026.

### 4.3 The Three Pillars (use across decks, site, press)

**The Protocol Leads.**
A laser is a tool. The protocol is the medicine. We built the protocol first and engineered the device to execute it.

**Skin of Every Shade.**
The PIH Prevention Protocol™ is engineered for Fitzpatrick I–VI — including the darker skin types most pico systems fail. Safety isn't a setting. It's a design principle.

**Data Makes Us Better.**
Real-world treatment data feeds back into protocol refinement. Every session makes the system smarter.

### 4.4 Audience-Specific Messaging

| Audience | Lead With |
| --- | --- |
| Dermatologists | Clinical authority, protocol depth, FDA clearance status, peer publications |
| Aesthetic APRNs / PAs | Safety on darker skin, training pathway, predictable outcomes, ROI |
| Medspa owners | ROI, brand differentiation, treatment outcome reliability, training |
| Investors | Category creation, IP moat (protocols + data), recurring revenue (kits + portal) |
| Press | The PIH wedge, the equity story, the August 8 launch, Roni Bolton's clinical authority |

### 4.5 Boilerplate (for press and partner use)

> **About Precise Aesthetics**
> Precise Aesthetics™ is a clinical technology company building the next generation of laser dermatology. The company's flagship system, Precise Pico™, pairs a multi-wavelength pico laser with the proprietary PIH Prevention Protocol™ — a clinical framework engineered to deliver predictable outcomes across every Fitzpatrick skin type. Precise Aesthetics is owned and operated by PS Medical Aesthetics, LLC, headquartered in Chicago, Illinois.

---

## 5. Visual Identity — Color

### 5.1 The Palette

Four token families. Use the right one in the right context. No off-system colors.

#### Midnight (primary dark)

Used for hero backgrounds, dark sections, premium moments. The dominant brand color.

| Stop | Hex | Usage |
| --- | --- | --- |
| midnight-50  | `#EEF1F7` | Tinted highlights on light |
| midnight-100 | `#D4DCEA` | Subtle borders on light |
| midnight-200 | `#A8B6CF` | Muted text on light |
| midnight-300 | `#6F82A6` | Disabled/muted |
| midnight-400 | `#3F567F` | Secondary on dark |
| **midnight-500** | **`#1F2F4F`** | **Primary navy** — hero backgrounds |
| midnight-600 | `#182542` | Card on midnight |
| midnight-700 | `#121C33` | Deep card |
| **midnight-800** | **`#0C1426`** | **Deepest navy** — luxury moments, primary CTA bg |
| midnight-900 | `#070C18` | Reserved |

#### Brand Blue (accent)

The soft blue from the logo. Used as accent — borders, focus rings, stroke details, the system diagram, links. Never as a dominant fill.

| Stop | Hex | Usage |
| --- | --- | --- |
| brand-50  | `#F2F7FC` | Hover background on bone |
| brand-100 | `#E0ECF7` | Subtle backgrounds |
| brand-200 | `#C2D9EF` | Borders, light states |
| **brand-300** | **`#A8C8E8`** | **Logo blue** — primary brand accent |
| brand-400 | `#7FAEDB` | Hover states |
| **brand-500** | **`#5891CA`** | **Mid blue** — links, CTAs on light |
| brand-600 | `#3D74AE` | Pressed/active |
| brand-700 | `#2B5688` | Reserved |
| brand-800 | `#1F3F65` | Reserved |
| brand-900 | `#152B47` | Reserved |

#### Champagne (luxury accent)

Reserved for premium moments. The "wax seal" of the brand. Use sparingly.

| Stop | Hex | Usage |
| --- | --- | --- |
| champagne-50  | `#FBF8F1` | Tinted backgrounds (rare) |
| champagne-100 | `#F4ECD9` | Badges, premium pills |
| **champagne-200** | **`#E8DCC4`** | **Primary champagne** — launch CTA, "Invitation Only" |
| champagne-300 | `#D9C9A8` | Hover state on champagne |
| champagne-400 | `#C5B187` | Borders on premium elements |
| champagne-500 | `#A89366` | Reserved |
| champagne-600 | `#87764F` | Reserved |

#### Bone & Ink (background and text)

| Token | Hex | Usage |
| --- | --- | --- |
| **bone-100** | **`#FAF7F2`** | **Default page background** (NEVER pure white) |
| bone-50  | `#FDFCF9` | Raised cards on bone |
| bone-200 | `#F2EDE3` | Subtle dividers |
| bone-300 | `#E5DDCC` | Stronger dividers |
| ink-900  | `#0A0F1C` | Headlines on bone |
| ink-700  | `#1F2A3D` | Body on bone |
| ink-500  | `#4A5568` | Muted on bone |
| ink-300  | `#8B95A7` | Captions on bone |
| cream-50  | `#FDFCF9` | Headlines on midnight |
| cream-100 | `#F4F0E8` | Body on midnight |
| cream-300 | `#C9C2B5` | Muted on midnight |

### 5.2 Color Usage Rules

- **Never use pure white (`#FFFFFF`).** Default to `bone-100` on light surfaces.
- **Never use pure black (`#000000`)** in body text. Use `ink-900` for nuance.
- **The brand blue is an accent, not a fill.** Never paint a section in `brand-300`. Use it for strokes, focus rings, links, and the soft glow on logos.
- **Champagne is sacred.** Use only when the moment is premium or scarce: launch CTA, "invitation only" badges, key trademark symbols, premium card edges. If you find yourself using champagne three times on a page, remove two.
- **Contrast is non-negotiable.** Body text 4.5:1 minimum, large text 3:1 minimum. Run the contrast check before shipping anything.

### 5.3 Color Pairings (canonical)

These pairings are tested and approved. Use them.

| Background | Body text | Headline | Accent |
| --- | --- | --- | --- |
| bone-100 | ink-700 | ink-900 | brand-500 |
| midnight-500 | cream-100 | cream-50 | brand-300 |
| midnight-800 | cream-100 | cream-50 | brand-300 |
| champagne-200 | ink-900 | ink-900 | midnight-800 |

### 5.4 Print & Pantone (for event signage, business cards, packaging)

| Brand color | Pantone (closest) | CMYK | RGB |
| --- | --- | --- | --- |
| Midnight 800 | Pantone 5395 C | 100 / 88 / 50 / 70 | 12 / 20 / 38 |
| Midnight 500 | Pantone 539 C | 100 / 80 / 35 / 35 | 31 / 47 / 79 |
| Brand Blue 300 | Pantone 543 C | 30 / 12 / 0 / 0 | 168 / 200 / 232 |
| Brand Blue 500 | Pantone 7682 C | 60 / 35 / 0 / 10 | 88 / 145 / 202 |
| Champagne 200 | Pantone 7501 C | 5 / 10 / 25 / 0 | 232 / 220 / 196 |
| Bone 100 | Pantone 7527 C | 0 / 2 / 6 / 2 | 250 / 247 / 242 |

Always verify Pantone against a physical Pantone book before mass production. The values above are starting points.

---

## 6. Visual Identity — Typography

### 6.1 Typefaces

**Display & Headings: Fraunces**
A variable serif by Phaedra Charles for Undercase Type. Editorial warmth, optical sizing, and three custom axes (SOFT, WONK, opsz) that let us tune the feel. Free, open source, hosted via Google Fonts or self-hosted via next/font.

**Body & UI: Inter**
A neutral, hyper-legible sans by Rasmus Andersson. Industry standard for modern interfaces. Free, open source.

**Monospace (code, technical): JetBrains Mono**
Used in Sanity Studio, code samples, and any technical documentation. Free.

### 6.2 Type Scale

| Role | Font | Size (responsive) | Weight | Tracking | Line-height |
| --- | --- | --- | --- | --- | --- |
| Display XL (hero) | Fraunces | clamp(56px, 6vw+1rem, 104px) | 400 | -0.02em | 1.05 |
| Display LG | Fraunces | clamp(44px, 4vw+1rem, 76px) | 400 | -0.02em | 1.05 |
| Display MD | Fraunces | clamp(36px, 3vw+1rem, 56px) | 400 | -0.02em | 1.05 |
| H1 | Fraunces | clamp(32px, 2.5vw+1rem, 48px) | 400-500 | -0.015em | 1.15 |
| H2 | Fraunces | clamp(26px, 1.5vw+1rem, 36px) | 400-500 | -0.015em | 1.15 |
| H3 | Fraunces | 24px | 500 | -0.01em | 1.2 |
| H4 | Fraunces | 20px | 500 | 0 | 1.3 |
| Lead | Inter | 20px | 400 | 0 | 1.5 |
| Body | Inter | 17px | 400 | 0 | 1.6 |
| Small | Inter | 15px | 400 | 0 | 1.55 |
| Caption | Inter | 13px | 400 | 0 | 1.5 |
| Overline | Inter | 12px | 500 | 0.12em | 1 |

### 6.3 Typography Rules

- **Headlines in sentence case.** "Predictable outcomes across every skin type." Not "Predictable Outcomes Across Every Skin Type."
- **Overlines in ALL CAPS** with `0.12em` letter-spacing. The only place we use all caps.
- **Display text gets generous tracking-tight** (-0.02em). Body stays at 0.
- **Line length:** body 60-72ch max. Headlines 14-22ch max.
- **No font weights above 600.** Fraunces is luxurious at 400-500. Above that, it loses elegance.
- **No italics in body copy** unless quoting a publication or using technical conventions (gene names, etc.).
- **Trademark symbols (™)** stay inline with the word, full size — no superscript.
- **Numerals:** use Fraunces' lining figures for tabular data, oldstyle for body copy.

### 6.4 Pairing Examples

**Hero pattern:**
```
[overline, Inter 12px tracked]      LAUNCHING AUGUST 8, 2026 · CIVIC OPERA BUILDING
[display-xl, Fraunces]              Protocol-driven pico laser.
[lead, Inter]                       Predictable outcomes across every skin type. The
                                    Precise Pico™ system pairs a multi-wavelength pico
                                    platform with the PIH Prevention Protocol™ —
                                    engineered for safety on Fitzpatrick I–VI.
```

**Section pattern:**
```
[overline, Inter 12px tracked]      THE PRECISE SYSTEM
[h1, Fraunces]                      A new standard in laser dermatology.
[body, Inter]                       Body content explaining the section.
```

**Editorial pattern (case studies, articles):**
```
[overline, Inter]                   CASE STUDY · MELASMA · FITZPATRICK V
[h1, Fraunces, italic kicker]       The case for protocol-led pico.
[lead, Inter]                       Brief introduction to the case.
```

---

## 7. Visual Identity — Logo System

The full logo package is in `/brand/logos/`. See `/brand/logos/README.md` for file index.

### 7.1 Logo Variants

1. **Horizontal lockup, cream on midnight** — primary on dark backgrounds
2. **Horizontal lockup, navy on bone** — primary on light backgrounds
3. **Horizontal lockup, single-color black** — print, embossing, fax
4. **Horizontal lockup, single-color white** — over photography
5. **Circle monogram (P|A in circle)** — social avatars, app icons, favicon
6. **Standalone monogram (P|A no circle)** — tight spaces, watermarks

### 7.2 Logo Usage Rules

**Clear space:** Maintain clear space around the lockup equal to the height of the cap "P" in the wordmark. Nothing — text, images, edges — enters this zone.

**Minimum size:**
- Horizontal lockup: 120px wide on screen, 1 inch wide in print
- Circle monogram: 32px on screen (favicon), 0.5 inch in print

**Backgrounds:** Place on solid backgrounds when possible. On photography, ensure the placement area is uncluttered and the contrast is sufficient. Use the white variant on dark photo, black variant on light photo, or add a tinted overlay to the photo behind the logo.

**Co-branding:** When pairing with a partner logo, use a vertical hairline divider in `brand-500` between marks. Equal visual weight. Equal clear space.

### 7.3 Logo Don'ts

- Do not stretch, skew, or rotate
- Do not change colors outside the approved palette
- Do not add drop shadows, gradients, or effects
- Do not place over busy photography without an overlay
- Do not recreate the lockup — use the supplied files
- Do not animate (the logo can fade in/out, but not "build")
- Do not add taglines beneath the existing tagline
- Do not enclose in shapes other than the approved circle
- Do not lock up with other text or imagery as if part of a single mark

---

## 8. Imagery & Photography

### 8.1 Photographic Style

**The mood:** clinical authority meets editorial warmth. Documentary-style, natural light, real practitioners and patients. No gloss. No obvious retouching.

**Reference brands:** Aesop product photography (light + restraint). The New York Times Magazine photo essays (documentary). Le Labo (texture and detail). Augustinus Bader (clinical-luxury).

**What we shoot:**
- Roni and the clinical team in their environment (procedure rooms, training, consultation)
- Practitioners using the device (after launch, with consent)
- Before/after patient photography (ALWAYS with signed consent)
- Detail shots of the device (close-ups, materials, the screen UI)
- Environmental shots (Chicago, the practice, the team)

**What we don't shoot:**
- Stock photography of women touching their faces
- Spa imagery (candles, towels, orchids)
- Glossy beauty shots
- Models pretending to be patients
- Generic medical clichés (lab coats, stethoscopes, microscopes)

### 8.2 Lighting & Color

- Natural daylight whenever possible
- For studio: soft, single-source key light, cool-neutral white balance
- Skin tones rendered accurately — never warm-shifted to look "healthier"
- Backgrounds: bone, midnight, or environmental (real rooms)
- Avoid: blown-out highlights, deep crushed blacks, heavy color grading

### 8.3 Subject Matter Rules

**Patient photography — always:**
- Signed consent on file (with explicit consent for marketing use)
- Same lighting, angle, distance for before/after pairs
- Honest framing — no flattering pose differences
- Treatment context labeled (sessions, indication, Fitzpatrick type, time elapsed)
- Sensitive content flagged in CMS

**Practitioner photography — always:**
- Permission and credentials review
- Title and practice attribution accurate
- No staged "looking thoughtfully into the distance" shots

### 8.4 AI-Generated Imagery

Permitted only for:
- Abstract or conceptual brand imagery (textures, atmospheric, no people)
- Internal mockups, decks, and ideation
- Stock-style supporting imagery clearly disclosed as illustrative

Never permitted for:
- Anything purporting to show real practitioners
- Anything purporting to show real patients or treatment outcomes
- Anything that could be mistaken for clinical evidence

### 8.5 Image Treatment

- All images use natural color (no heavy LUTs or filters)
- 16:9 hero images preferred for site, 4:5 for social, 1:1 for avatars
- Subtle vignette acceptable on hero images, never elsewhere
- No borders or framing devices except the brand-500 hairline (used sparingly as editorial accent)

---

## 9. Iconography

### 9.1 Icon System

**We use Lucide React exclusively.** No mixed icon libraries. No emoji as icons. No custom icons unless absolutely necessary.

**Stroke widths:**
- 1.5 default
- 1.75 hero / decorative
- Never 1 (too thin) or 2.5+ (too heavy)

**Sizes:**
- 16px (inline with caption text)
- 20px (inline with body)
- 24px (UI, default)
- 32px (hero, feature callouts)
- 48px (rare, oversized featured)

### 9.2 Icon Color Rules

- Inherit from text color by default
- Brand-blue icons only when intentionally accenting (e.g., decorative inline)
- Never colorize icons in unrelated brand colors
- Never use filled icons in marketing copy — line icons only

### 9.3 Custom Icons

If a Lucide icon doesn't exist, document the request and either:
- Find a near-equivalent in Lucide
- Commission a custom SVG drawn at 24×24 with 1.5px stroke matching Lucide's visual language

Never mix Heroicons, Phosphor, Feather, or others into the system.

---

## 10. Layout & Composition

### 10.1 Spacing Scale

8px-based grid. Use only these values: 4, 8, 12, 16, 24, 32, 48, 64, 80, 96, 128, 160px.

### 10.2 Section Rhythm

- Section vertical padding: `py-20` mobile, `py-32` desktop
- Hero vertical padding: `py-32` mobile, `py-40` desktop
- Section-to-section transitions: hard. No fades, no gradients between sections.

### 10.3 Container Widths

| Context | Max-width |
| --- | --- |
| Default container | 1280px |
| Prose / editorial | 720px |
| Narrow (forms, modals) | 560px |

### 10.4 Composition Principles

**1. Whitespace is content.** If the layout looks "empty," it's working. Resist the urge to fill.

**2. One focal point per fold.** Each scroll-height section has one thing the reader should look at first.

**3. Hierarchy through scale, not weight.** Use type size to establish hierarchy before reaching for bold or color.

**4. Asymmetry over symmetry.** Centered layouts feel templated. Off-center, rhythmic layouts feel intentional.

**5. Editorial pacing.** Vary section widths and densities like a magazine — full-bleed image, then narrow text column, then split, then breathing room.

### 10.5 Grid System

- 12-column grid on desktop (≥1024px)
- 6-column grid on tablet (768-1023px)
- 4-column grid on mobile (<768px)
- Gutter: 24px desktop, 16px mobile

---

## 11. Motion & Interaction

### 11.1 Motion Principles

**1. Purposeful.** Every animation must serve comprehension. If it's just decoration, remove it.

**2. Restrained.** Linear, Stripe, Vercel — that's our motion register. Subtle, fast, deliberate.

**3. Earned.** Hero animations on first load, yes. Every section fading in on scroll, no.

**4. Reduced-motion-aware.** All motion respects `prefers-reduced-motion: reduce`.

### 11.2 Easing & Timing

| Token | Value | Use |
| --- | --- | --- |
| ease-out | `cubic-bezier(0.22, 1, 0.36, 1)` | Most UI motion |
| ease-in-out | `cubic-bezier(0.65, 0, 0.35, 1)` | Bidirectional (modals) |
| duration-fast | 150ms | Hover, color transitions |
| duration-base | 220ms | Most UI transitions |
| duration-slow | 400ms | Modal/sheet entry |
| duration-deliberate | 700ms | Hero entrance, system diagram |

### 11.3 Where Motion Is Allowed

- Hero entrance (one deliberate animation per page load)
- The System diagram (sequenced reveal of the four pillars)
- The Treatment Flow (sequenced reveal of the seven steps)
- Hover states on interactive elements
- Modal / sheet open/close
- Form field focus
- Launch countdown (continuous tick)

### 11.4 Where Motion Is Forbidden

- Every section fading in as user scrolls
- Text revealing letter-by-letter
- Parallax decoration
- Auto-playing video
- Looping animations in marketing copy
- Cursor effects (custom cursors, trailing dots)
- Page transition effects between routes

---

## 12. Email Identity

### 12.1 Transactional Emails (Resend + React Email)

- Width: 600px max, mobile-responsive
- Background: `bone-100`
- Logo: navy horizontal lockup, top-left, 200px wide
- Body: Inter, 16px, ink-700 on bone
- Headlines: Fraunces, 24-28px, ink-900
- Buttons: midnight-800 fill, cream-50 text, 6px radius
- Footer: ink-500, 13px, with mailing address (CAN-SPAM)
- No images other than logo unless content-essential
- Plain-text fallback always provided

### 12.2 Email Signatures

```
[Name]
[Title]
Precise Aesthetics™
[Phone] · [email]
preciseaesthetics.com
```

Single-color, no logo image (some clients block), no inspirational quote.

### 12.3 Marketing Emails

For nurture sequences and launch announcements:

- Editorial layout, image-led, single CTA per email
- Subject line: 6-9 words, sentence case, no emoji
- Preview text: complementary to subject, not redundant
- Plain text version always provided
- Unsubscribe link in footer, not buried
- Frequency cap: maximum 1 marketing email per practitioner per week

---

## 13. Social Identity

### 13.1 Platforms (priority order)

1. **LinkedIn** — primary for B2B. Practitioners and industry.
2. **Instagram** — visual storytelling, before/after, behind the scenes.
3. **YouTube** — long-form clinical education, testimonials, training previews.
4. **X / Twitter** — selective, news-driven, KOL engagement.

### 13.2 Profile Setup

- Avatar: circle monogram dark variant (`precise-aesthetics-monogram-circle-dark-1024.png`)
- Banner: cream lockup on midnight, with brand promise typeset as headline
- Bio: 3-line max, ends with "Launching Aug 8, 2026"
- Link: preciseaesthetics.com

### 13.3 Content Pillars

1. **The system** — what makes Precise different
2. **The science** — clinical content, protocols, education
3. **The team** — Roni, advisors, the people behind the work
4. **The patients** (with consent) — outcomes, real shade variety
5. **The journey** — building the company, launch countdown

### 13.4 Visual Templates (Instagram)

- 1080×1350 (4:5) preferred for feed
- 1080×1080 (1:1) acceptable
- Story: 1080×1920 (9:16)
- Always: brand colors, Fraunces headlines, Inter captions
- Never: stock graphics, generic templates, emoji-heavy captions

### 13.5 Captions

- Lead with one editorial sentence
- Then context (2-3 sentences)
- Sign off with the brand promise or a clean CTA
- Hashtags: 3-5 maximum, lowercase, no spam chains
- Approved hashtags: #preciseaesthetics #precisepico #pihprevention #laserdermatology #skinofeveryshade

---

## 14. Presentation System (Decks)

### 14.1 Deck Templates

Two master decks: investor and clinical.

**Investor deck:**
- Cover: midnight-800 background, cream lockup centered, deck title in Fraunces
- Section dividers: full-bleed champagne with single-line title in midnight
- Content slides: bone background, Fraunces headlines, Inter body
- Data slides: minimal charts, brand colors only, Fraunces axis labels

**Clinical deck:**
- Same structure, but content emphasizes protocol, parameters, before/afters
- Reserve champagne for "results" and "outcomes" sections only
- Always include indication, Fitzpatrick type, session count on case study slides

### 14.2 Slide Rules

- One headline per slide
- Maximum 3 supporting lines of body copy
- One image OR one chart, never both on the same slide
- Page numbers: lower-right, Inter 11px, ink-500
- Footer: brand name + section label, lower-left, Inter 11px

### 14.3 Forbidden in Decks

- Bullet points longer than 8 words
- "Thank you" final slide (use a CTA slide instead)
- Stock illustrations
- Slides with more than one "wow" moment
- Animations on bullet reveals (looks dated)

---

## 15. Print & Event Applications

### 15.1 Business Cards

- 3.5 × 2 in, US standard
- Stock: Mohawk Loop Antique Vellum or equivalent (uncoated, warm-white)
- Front: monogram circle dark or navy lockup, centered
- Back: name, credentials, title, contact info, in Inter
- Print: 1-color (midnight) on bone stock, OR 2-color (midnight + brand-500) on bone
- Optional letterpress for premium tier

### 15.2 Letterhead

- 8.5 × 11 in
- Header: navy horizontal lockup, top-left, 240px wide
- Footer: PS Medical Aesthetics, LLC. Address. Phone. preciseaesthetics.com.
- Body: Inter 11pt, ink-700, 1.5 line-height
- Margins: 1 inch all sides

### 15.3 Launch Event Materials (Aug 8, 2026 — Civic Opera Building)

**Invitation (printed)**
- Format: 5 × 7 in, double-sided, on Mohawk Superfine Cover, soft white
- Front: champagne foil monogram circle, centered, on midnight stock
- Back: Fraunces typesetting:
  ```
  Precise Aesthetics™ requests your presence
  for the unveiling of Precise Pico™

  Saturday, the eighth of August, two thousand twenty-six
  Civic Opera Building Rooftop · Chicago

  Cocktails and clinical demonstrations at seven o'clock
  Black tie optional · By invitation only

  Kindly respond by July 25th
  preciseaesthetics.com/launch
  ```

**Step & repeat / press wall**
- 8 × 8 ft, midnight background
- Repeating cream lockup pattern with champagne dividers
- Single hashtag in lower-right: #preciseaesthetics

**Name tags**
- Plain bone stock, 3 × 4 in, lanyard
- Top: small monogram circle, navy on bone
- Center: first name in Fraunces 28pt
- Below: full name in Inter, then practice/role in Inter caption

**Signage**
- Wayfinding: midnight backgrounds, cream Fraunces, brand-300 directional arrows
- Stage signage: full-bleed cream lockup on midnight, oversized
- Bar / station signs: champagne backgrounds, midnight Fraunces

**Programs / agenda cards**
- 4 × 9 in, bone stock, single-fold or flat
- Same typography rules as letterhead

### 15.4 Packaging (Phase 2 — Treatment Kits)

When skincare kits launch:

- Boxes: rigid, soft-touch midnight finish
- Foil monogram circle in champagne on lid
- Inside: bone-printed instruction insert, single-color midnight
- Labels: minimal, clinical-style, ingredient list in Inter mono-style
- Sustainability: FSC-certified paper, recyclable construction

### 15.5 Device Marking & Placards

- Small navy monogram circle on the device chassis
- Spec plate: brushed metal with etched (not printed) text
- Setup guide: bone interior, midnight cover, Fraunces title, Inter instructions

---

## 16. Co-Branding Rules

When Precise Aesthetics appears alongside another brand (partner clinic, conference, KOL):

- Equal visual weight unless contractually specified otherwise
- Vertical hairline divider (1px, brand-500, 50% of logo height) between marks
- Equal clear space on all sides
- Order: Precise Aesthetics on the left for partnerships; Precise Aesthetics in the position of seniority for sponsorships
- Never combine logos into a single mark
- Never alter Precise Aesthetics colors to match partner brand

For conference badges, sponsorship leaderboards, and similar:
- Use the navy horizontal lockup
- Never use the cream variant unless the host brand requires dark backgrounds
- Provide a 30-second write-up to organizers using the boilerplate in Section 4.5

---

## 17. Accessibility Standards

**WCAG 2.2 AA minimum on all surfaces. Non-negotiable.**

### 17.1 Color & Contrast

- Body text: 4.5:1 minimum
- Large text (18pt+ or 14pt bold+): 3:1 minimum
- UI components & graphical objects: 3:1 minimum
- Run contrast on every approved color pairing before shipping

### 17.2 Typography

- Minimum body size: 16px on web, 14pt in print
- Avoid text below 13px even in captions
- Line-height: 1.5 minimum for body
- Letter-spacing: never negative on body text

### 17.3 Motion

- Honor `prefers-reduced-motion: reduce` everywhere
- No animations critical to comprehension
- Pause/stop controls on any animation longer than 5 seconds

### 17.4 Forms & Interaction

- Labels for every form field (visible or aria-label)
- Focus visible on every interactive element
- Touch targets ≥ 44 × 44px
- Error messages associated with fields via aria-describedby
- No color-only error indication

### 17.5 Imagery

- Alt text required on every image (Sanity field enforces)
- Decorative imagery: empty alt (`alt=""`) so screen readers skip
- Complex imagery (charts, diagrams): long-description or accessible alternative

---

## 18. Brand Governance

### 18.1 Who Approves What

| Decision | Approver |
| --- | --- |
| Brand strategy / positioning changes | Founders + Clinical Director |
| New product naming | Founders + Legal |
| Visual identity changes | Brand owner (designate one person) |
| Co-branding agreements | Founders + Legal |
| Press releases / boilerplate edits | Marketing lead + Founders |
| Clinical claims / protocol language | Roni Bolton, APRN, DCNP + regulatory consultant |
| New marketing assets (within system) | Marketing lead |

### 18.2 Asset Management

All brand assets live in:
- **Source files:** `/brand-source/` in Google Drive (vector AI files when commissioned)
- **Production assets:** `/public/brand/` in the preciseaesthetics.com repo
- **Distribution:** Press kit at `preciseaesthetics.com/press`

### 18.3 Quarterly Brand Review

Once per quarter, the brand owner conducts a 30-minute audit:
- Recent assets produced — on-brand?
- New voice patterns emerging — codify or correct?
- Any drift in social, decks, partner usage?
- Update this document as needed.

---

## 19. Trademark & Legal

### 19.1 Trademark Filing

The following marks should be filed with the USPTO before the August 8, 2026 launch:

- **Precise Aesthetics™** — words, in class 10 (medical apparatus) and class 44 (medical/aesthetic services)
- **Precise Pico™** — words, in class 10
- **PIH Prevention Protocol™** — words, in class 10 and class 44
- **The P|A monogram** — design mark, in class 10
- **The horizontal lockup** — design + words, in class 10

Engage trademark counsel by **May 15, 2026** to allow for filing, search, and any office action before launch.

### 19.2 Trademark Notices

Use ™ on all uses until registered. Once registered (typically 6-12 months post-filing):
- Switch to ® on registered marks
- Add registration notice in legal copy: *"Precise Aesthetics® is a registered trademark of PS Medical Aesthetics, LLC."*

### 19.3 Copyright

Footer copyright on all materials:
> © 2026 PS Medical Aesthetics, LLC. All rights reserved.

Update year annually January 1.

### 19.4 Regulatory Disclaimers

When making any medical claim, follow FDA guidance for the device's clearance status:
- **Pre-clearance (now):** No specific therapeutic claims. Marketing limited to general "laser dermatology technology" language.
- **Post-clearance:** Claims must match the indications-for-use exactly. Run all marketing through regulatory consultant.

---

## 20. The Living Document

This brand identity is a starting point, not a cage.

As Precise Aesthetics grows — new products, new audiences, new market understanding — this document evolves. The bones (positioning, voice pillars, core visual identity) should remain stable. The expression (campaigns, photography directions, editorial patterns) can flex.

When in doubt about whether something is "on brand," return to the brand promise:

> **Predictable outcomes across every skin type.**

If the work serves that promise, it's probably on brand. If it doesn't, it's probably not.

---

**End of brand identity system. Version 1.0. April 2026.**

Maintained by PS Medical Aesthetics, LLC. Questions: hello@preciseaesthetics.com.
