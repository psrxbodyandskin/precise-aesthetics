# Session 6 — /system Architecture Page + 4 Pillar Deep Dives

> Run from repo root. Builds the entire `/system` section of the marketing site: one manifesto page + four pillar deep-dive pages + nav dropdown integration.

## Setup Before This Session

**Activate skills:**
- `ui-ux-pro-max`
- `frontend-design`

**Read these in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/SYSTEM-MANIFESTO-FINAL-V2.md` (this is the locked manifesto copy — verbatim)
6. This spec

**Reference for visual standard:** the homepage as currently shipped is the bar. /system pages must match or exceed that level of editorial polish. No regression.

---

## What Gets Built

Five pages plus nav update:

| Route | Purpose | Content type |
| --- | --- | --- |
| `/system` | Manifesto + architecture overview | Editorial prose, 8 sections |
| `/system/protocols` | The protocol library, public marketing surface | Mixed editorial + structured |
| `/system/delivery` | Delivery as a system pillar (NOT the Pico product page) | Mixed editorial + structured |
| `/system/biologic-control` | Prep / recovery / maintenance kits | Mixed editorial + structured |
| `/system/data-intelligence` | The Data Intelligence Layer | Mixed editorial + structured |

Plus: `Header.tsx` nav dropdown update so "The System" expands to show overview + four pillars.

**Out of scope this session:**
- `/pico` (separate product page, future session)
- `/about` (future session)
- The practitioner portal (`/portal`, future session)
- The admin panel (future session)
- 3D visuals beyond what's already in the homepage hero

---

## Critical Constraints

1. **MASTER.md tokens only.** No new colors, fonts, icons.
2. **Manifesto copy verbatim from `SYSTEM-MANIFESTO-FINAL-V2.md`.** Do not paraphrase.
3. **Match homepage visual standard.** Pull quotes, drop caps, Fig. annotations, hairline dividers, gradient textures, `§` section marks — all carry over to /system pages.
4. **No personalities, no founder content.** Brand stays system-first.
5. **No 3D in this session.** Pillar pages use static editorial visuals (placeholders styled intentionally, like the homepage Section 3 placeholders).
6. **Updated language throughout:** Fitzpatrick I–VI (not IV–VI), prep/recovery/maintenance kits (not pre/post).
7. **Lighthouse 95+ on all five pages.** Performance, A11y, Best Practices, SEO.
8. **Server Components by default.** Client only when needed.

---

# PAGE 1 — `/system` (the manifesto + architecture page)

**Route:** `app/(marketing)/system/page.tsx`

**Tone:** Mixed — bone-100 for editorial sections, midnight-deep for the closing architecture diagram. Heavy editorial register. This is the most important written document on the site.

**Structure (top to bottom):**

## 1.1 — Hero

Dark midnight-deep section. No 3D. Single-column centered.

```
Eyebrow: § THE THESIS

Display heading (Fraunces, oversized, two lines, italic on second line):
The system is the medicine.
The device is the instrument.

(brief lead, max-w-[58ch], cream-100, centered)
The architecture behind The Precise System™ — and why we built it 
this way.

(Fig. 01 annotation in top-right corner, same treatment as homepage)
```

Hero takes ~70vh. Generous space. No CTAs in hero — manifesto pages let people read first, not act first.

## 1.2 — Section 2: "The Problem We Refused to Inherit"

Bone-100 section. Single column, prose width (max 720px). Editorial layout.

Use the **homepage thesis section composition** as the reference — pull quote on the left in italic Fraunces, body prose on the right with drop cap on the first paragraph.

```
Eyebrow: § Fig. 02

Pull quote (italic Fraunces, large, left column):
"What the industry got wrong."

Body (right column, BodyText, ink-700, with drop cap on first paragraph):
[manifesto Section 2 body verbatim]

Italicized pivot line at end:
We started over.
```

The italicized pivot line gets its own paragraph with extra top margin (mt-8) — reads as the section's punctuation.

## 1.3 — Section 3: "Why System"

Same bone-100 background, but flip the composition: pull quote on the right, body on the left.

```
Eyebrow: § Fig. 03

Body (left column, with drop cap):
[manifesto Section 3 body verbatim]

Pull quote (italic Fraunces, right column):
"A system is not a bundle."
```

The four-pillar paragraph in this section ("Protocols are the medicine... The device is the instrument...") gets visual weight — slightly larger text, more spacing.

## 1.4 — Section 4: "Why Four" + The Architecture Diagram

Midnight-deep section. This is where the architecture story compresses into a visual.

```
Eyebrow: § Fig. 04 — THE ARCHITECTURE

Heading (Fraunces, cream-50):
The four are not a marketing structure.

Body (cream-100, max-w-[58ch]):
[manifesto Section 4 body verbatim]

Italicized pivot line:
Four is not a number we settled on. It is the number the 
engineering required.

Below the body — the architecture diagram (static SVG, NOT 3D):
A simple closed-loop diagram showing the four pillars connected 
by arrows. Use the same visual language as the homepage hero but 
flat, schematic, editorial — like a technical drawing in a textbook.

Each pillar is a labeled card:
- Protocols (top-left) — "Defines the what"
- Delivery Mechanism (top-right) — "Executes the how"
- Biologic Control (bottom-right) — "Governs the recovery"
- Data Intelligence Layer (bottom-left) — "Enables the refinement"

Arrows flow clockwise: Protocols → Delivery → Biologic → Data → 
Protocols. Labeled with the verbs (executes, applies to, captures, 
refines).
```

This diagram is the central visual of the entire page. Keep it simple — flat 2D SVG, brand colors only, hairlines for arrows. Editorial, not flashy.

## 1.5 — Section 5: "What the Precise System Is"

Back to bone-100. Single column, centered, generous whitespace.

```
Eyebrow: § Fig. 05

Heading (Fraunces, ink-900, centered, max-w-[20ch]):
What the Precise System is.

Body (centered, max-w-[58ch]):
[manifesto Section 5 body — short, two paragraphs]

Italicized pivot line, centered, large:
Practitioners do not buy a device from us. They buy into a system.
```

Short section. Quiet. Confident.

## 1.6 — Section 6: "The Closed Loop"

Midnight-deep. Two-column layout.

```
Left column:
Eyebrow: § Fig. 06
Heading (cream-50): Every cycle gets sharper.
Body (cream-100): [manifesto Section 6 body verbatim]

Right column:
A second supporting diagram — a simple cyclical visualization 
showing data flowing back into protocols over time. SVG. Could 
be a series of concentric rings each labeled with a "version" 
(Protocol v1.0 → v1.1 → v1.2 etc), suggesting iteration.
Or: a small timeline showing protocol updates getting tighter 
over time.

This diagram is decorative-supporting, not central. Smaller than 
the architecture diagram in Section 4.
```

## 1.7 — Section 7: "The Standard We Hold"

Bone-100. Single column, centered.

```
Eyebrow: § Fig. 07

Heading (Fraunces): The patients we built this for.

Body: [manifesto Section 7 body verbatim]

Italicized pivot line:
If the answer was no, we changed the inputs.
```

## 1.8 — Section 8: Closing + CTA

Midnight-deep. Centered, dramatic.

```
Display heading (italic Fraunces, oversized, cream-50):
This is what a clinical system looks like.

Body (cream-100, centered, large):
Four pillars. One closed loop. Predictable outcomes across 
every skin type.

CTA row (centered):
[Primary]: Request a demonstration → /demo
[Secondary]: See the data layer → /system/data-intelligence
```

This closing section is the page's send-off. Generous padding, restrained typography, focused.

---

# PAGE 2 — `/system/protocols`

**Route:** `app/(marketing)/system/protocols/page.tsx`

**Purpose:** Public marketing for the protocol library. The actual library is gated in /portal — this page sells the concept.

**Tone:** Mixed — opens editorial like /system, becomes more structured/clinical mid-page, closes editorial.

**Structure:**

## 2.1 Hero (midnight-deep)

```
Eyebrow: § THE FIRST PILLAR
Display heading: Protocols.
                 The medicine, not just the laser.

Lead (cream-100): The protocol library is the proprietary clinical 
IP at the center of the Precise System. Indication-specific 
frameworks engineered for Fitzpatrick I through VI — including the 
darker skin types the industry has historically struggled to treat.

(Fig. 01 annotation top-right)
```

## 2.2 The Thesis (bone-100, editorial)

Pull quote left / body right composition.

```
Pull quote: "A laser without protocols is a tool without instructions."

Body (drop cap on first paragraph):
[Drafted ~250 word essay explaining what "protocol" means in this 
context — not just settings, but a complete clinical framework: 
patient assessment, indication identification, parameter selection, 
energy application sequence, biologic control coordination, and 
follow-up. Mark as // [DRAFT] for review.]
```

## 2.3 What the Library Contains (bone-100, structured)

Heading: "Inside the protocol library."

Below the heading, a structured grid showing protocol categories. Each cell is a small card with:
- Category name (Fraunces 18px)
- Brief description (Inter 14px, ink-700)
- Indication tags (small Inter overline, brand-700)

```
Categories to include:
- PIH Prevention Protocol™ (the flagship)
- Tattoo removal — across skin types
- Melasma treatment frameworks
- Post-inflammatory hyperpigmentation
- Lentigines and sun damage
- Café-au-lait macules
- Nevus of Ota / Hori's nevus / zygomaticus
- Becker's nevus
- Acne scar resurfacing
- Fine lines and rhytids
- Skin rejuvenation protocols
- General pigment correction
```

Mark all category descriptions as `// [DRAFT — clinical review required]` until Roni signs off.

## 2.4 The Engineering of a Protocol (midnight-deep)

A more technical section explaining how a protocol is constructed. Editorial register but technical content.

```
Heading: How a protocol is built.

Body explaining (drafted, ~300 words):
- Indication-specific clinical frameworks
- Parameter envelopes (wavelength, fluence, pulse duration, spot size)
- Patient-specific adjustments based on Fitzpatrick type
- Treatment sequence and spacing
- Required biologic control regimen
- Outcome tracking inputs for the Data Intelligence Layer
- Continuous refinement based on aggregated outcomes

Use a small structured callout (similar to homepage "What's Included" 
card) showing the components of a protocol entry.
```

## 2.5 The PIH Prevention Protocol™ Spotlight (bone-100)

This is the flagship. Give it its own section.

```
Eyebrow: § THE FLAGSHIP

Heading: The PIH Prevention Protocol™.

Body (drafted, ~400 words):
Why post-inflammatory hyperpigmentation (PIH) is the wedge.
What makes Fitzpatrick III–VI vulnerable to PIH after laser treatment.
How the protocol prevents it from the first pulse.
The protocol's inputs (parameters, biologic control, spacing).
The outcome data that validates it.

Mark as // [DRAFT — clinical sign-off required]
```

## 2.6 Closing CTA (midnight-deep)

```
Heading: Access the protocol library.

Body: Practitioners using The Precise System gain full access to 
the protocol library through the practitioner portal. Updates and 
new protocols are pushed continuously based on real-world outcome 
data.

CTA row:
[Primary]: Request a demonstration → /demo
[Secondary]: Inside the data layer → /system/data-intelligence
```

---

# PAGE 3 — `/system/delivery`

**Route:** `app/(marketing)/system/delivery/page.tsx`

**Purpose:** Delivery as an architectural pillar (device-agnostic). NOT a product page for Pico — that's `/pico`, future session.

**Critical:** This page talks about "the role of delivery in the system." It does NOT pitch the Precise Pico product. Mention Pico once as the current device executing this pillar, with a link to /pico, but the page is about the architectural role.

## 3.1 Hero (midnight-deep)

```
Eyebrow: § THE SECOND PILLAR
Display heading: Delivery.
                 The instrument, not the system.

Lead: The device is the part of the system most companies sell 
first. We design it last. The delivery mechanism exists to execute 
the protocol with precision — not to define what's possible.
```

## 3.2 Inversion of the Industry (bone-100, editorial)

```
Pull quote: "Hardware exists to serve the protocol — not the other way around."

Body (drop cap):
[Drafted ~300 word essay on how the industry built backward — 
device-first, protocols-as-marketing-afterthought. The Precise 
System inverts that. The device specs are determined by what the 
protocols require, not by what the engineering team wanted to ship.]
```

## 3.3 What Delivery Requires (bone-100, structured)

```
Heading: The engineering requirements.

Structured list of architectural requirements (not product specs):
- Multi-wavelength capability — to address pigmented vs. tattooed 
  vs. dyschromic vs. textural targets
- Sub-nanosecond pulse precision — to disrupt pigment without 
  thermal damage
- Wavelength-specific energy parameters — calibrated to the 
  protocol library
- Repeatability across treatments — same parameters, same outcome
- Practitioner workflow integration — minimal cognitive load 
  during treatment
```

Each as a small numbered item, similar to the homepage "What's Included" treatment.

## 3.4 The Current Device (midnight-deep)

```
Eyebrow: § THE CURRENT INSTRUMENT

Heading: Precise Pico™.

Body: The current device executing the Delivery pillar is Precise 
Pico™ — a four-wavelength pico laser engineered to the architectural 
requirements above. Future devices in the Precise System line will 
extend the Delivery pillar into adjacent treatment categories. The 
architecture stays. The instrument evolves.

[Link]: Meet Precise Pico™ → /pico
```

## 3.5 Why a Device Alone Fails (bone-100, editorial)

```
Pull quote: "A device without protocols is a tool without instructions."

Body explaining (drafted, ~250 words):
The argument that a great laser alone produces great outcomes is 
false. Same laser, different practitioners, different protocols 
= wildly different outcomes. The system is what makes the device 
clinically reliable.
```

## 3.6 Closing CTA (midnight-deep)

```
CTA row:
[Primary]: Request a demonstration → /demo
[Secondary]: See Precise Pico™ → /pico
```

---

# PAGE 4 — `/system/biologic-control`

**Route:** `app/(marketing)/system/biologic-control/page.tsx`

**Purpose:** The third pillar — prep, recovery, maintenance kits as engineered clinical components, not skincare add-ons.

## 4.1 Hero (midnight-deep)

```
Eyebrow: § THE THIRD PILLAR
Display heading: Biologic Control.
                 Healing is part of the protocol.

Lead: Most laser systems treat what happens between sessions as 
the patient's problem. The Precise System treats it as part of 
the architecture. Prep, recovery, and maintenance kits are 
engineered as clinical components — not retail skincare.
```

## 4.2 Why Healing Is Engineering (bone-100, editorial)

```
Pull quote: "A protocol without biologic control is a plan without a patient."

Body (drop cap):
[Drafted ~300 word essay arguing that the biology between sessions 
is as important as what happens during treatment. PIH, complications, 
and inconsistent outcomes are largely a function of skin state — 
not laser parameters alone. Engineered biologic control turns 
"recovery" into a clinical input, not an afterthought.]
```

## 4.3 Three-Stage System (bone-100, structured)

This page introduces the prep/recovery/maintenance terminology. Make it clear and structured.

```
Heading: Three stages. One coordinated regimen.

Three-card layout (similar to homepage Outcomes):

CARD 1 — PREP
Icon: ShieldCheck
Headline: Prep
Description: Skin preparation in the days before treatment. 
Hydration, barrier reinforcement, and pigment stabilization to 
reduce treatment-day complication risk.
Items: [list 4-5 product types in the prep kit, drafted, // [DRAFT]]

CARD 2 — RECOVERY  
Icon: HeartPulse
Headline: Recovery
Description: Post-treatment regimen calibrated to the specific 
protocol. Inflammation control, barrier repair, and pigment 
stabilization in the critical 72 hours after treatment.
Items: [list 4-5 product types in the recovery kit, // [DRAFT]]

CARD 3 — MAINTENANCE
Icon: Refresh (or similar Lucide icon for "ongoing")
Headline: Maintenance
Description: Ongoing skin support between sessions and after 
treatment series completion. Maintains pigment uniformity and 
prepares skin for future sessions.
Items: [list 4-5 product types in the maintenance kit, // [DRAFT]]
```

## 4.4 Engineered for Fitzpatrick I–VI (midnight-deep)

```
Pull quote (italic Fraunces, cream-50): 
"The skin types the industry treated as edge cases were the cases 
we engineered for first."

Body (drafted, ~250 words):
Why most existing skincare paired with lasers fails on darker skin 
types — and how the Precise biologic control kits were formulated 
specifically for Fitzpatrick I–VI tolerance from the first patch test.

Mark as // [DRAFT — formulator/clinical review required]
```

## 4.5 Closing CTA (bone-100)

```
CTA row:
[Primary]: Request a demonstration → /demo
[Secondary]: Inside the data layer → /system/data-intelligence
```

---

# PAGE 5 — `/system/data-intelligence`

**Route:** `app/(marketing)/system/data-intelligence/page.tsx`

**Purpose:** The fourth pillar — the Data Intelligence Layer. The mechanism that makes the system get smarter.

## 5.1 Hero (midnight-deep)

```
Eyebrow: § THE FOURTH PILLAR
Display heading: Data Intelligence.
                 Every cycle gets sharper.

Lead: The Data Intelligence Layer is what separates The Precise 
System from a piece of equipment. Every treatment a practitioner 
runs becomes input that refines the protocol library — for every 
practitioner using the system.
```

## 5.2 The Closed Loop, Explained (bone-100, editorial)

```
Pull quote: "A device without outcome data is a machine that cannot improve."

Body (drop cap):
[Drafted ~350 word essay explaining the closed loop in detail:
- Practitioners log treatment outcomes in the practitioner portal
- The system aggregates outcomes across the network
- Pattern detection surfaces refinements (parameter adjustments, 
  protocol updates, biologic control optimizations)
- Updates are reviewed, tested, and pushed to the protocol library
- Next session uses the refined protocol
- Repeat]
```

## 5.3 The Architecture Diagram (midnight-deep)

A slightly more detailed version of the closed-loop diagram from /system. Shows the data flow specifically:

```
Heading: How the layer learns.

Diagram (static SVG):
- Practitioner runs treatment using Protocol v.X
- Outcome logged in portal
- Outcome aggregated across the network in the Data Intelligence Layer
- Pattern detection runs (continuous)
- Protocol updates surfaced for clinical review
- Roni Bolton, APRN DCNP — Clinical Director — reviews and approves 
  (NOTE: this is the only place Roni gets named on the public site, 
  and only in the context of clinical authorship of protocol updates 
  — confirm this is acceptable)
- Approved updates pushed as Protocol v.X+1
- Practitioners receive update notifications in the portal

[FLAG FOR USER: confirm Roni's name appearing here is acceptable 
or remove and refer to "clinical leadership" anonymously]
```

## 5.4 What Data Is Captured (bone-100, structured)

```
Heading: The inputs.

Numbered list of what gets captured per session:
01. Treatment indication and Fitzpatrick type
02. Protocol version used
03. Device parameters applied
04. Biologic control regimen used
05. Treatment outcome at scheduled follow-up intervals
06. Complications, if any
07. Practitioner notes and adjustments
08. Patient-reported outcomes (where applicable)

Trust microcopy below: 
"All data is de-identified at the point of capture. The Data 
Intelligence Layer aggregates patterns, not patient records."
```

## 5.5 What Practitioners Get Back (midnight-deep, structured)

```
Heading: The outputs.

Three-card layout:

CARD 1 — Continuous protocol updates
The protocol library updates based on aggregated outcomes. 
Practitioners receive new and refined protocols automatically.

CARD 2 — Aggregate insights
Anonymized pattern data from across the practitioner network — 
useful for clinical decision-making in the practitioner's own 
practice.

CARD 3 — Outcome benchmarks  
Each practitioner can compare their outcomes against network 
aggregates (anonymized), surfacing opportunities for refinement.
```

## 5.6 Privacy + Ethics (bone-100, plain prose)

A short section addressing data ethics. This builds trust.

```
Heading: How we handle the data.

Body (drafted, ~200 words):
Patient identifiers never enter the Data Intelligence Layer. 
Practitioners log outcomes in their own portal; the layer receives 
de-identified aggregated patterns. Compliance with HIPAA and 
state-specific clinical data regulations is the floor, not the 
ceiling. The data exists to make outcomes better — for patients, 
practitioners, and the system. It does not exist to be sold or 
shared.

Mark as // [DRAFT — legal review required before launch]
```

## 5.7 Closing CTA (midnight-deep)

```
CTA row:
[Primary]: Request a demonstration → /demo
[Secondary]: See the architecture → /system
```

---

# NAV DROPDOWN — Header Update

**File:** `components/layout/Header.tsx`

**Current state:** "The System" is a single link in the nav.

**New state:** "The System" becomes a hover/click dropdown. On desktop: hover-triggered. On mobile: click-triggered (existing menu pattern).

**Dropdown structure:**

```
The System ▾
├── Overview                    → /system
├── Protocols                   → /system/protocols  
├── Delivery Mechanism          → /system/delivery
├── Biologic Control            → /system/biologic-control
└── Data Intelligence Layer     → /system/data-intelligence
```

**Visual treatment:**
- Dropdown panel opens below the nav item
- Background: bone-100 (matches the header's light area, even on midnight pages)
- Subtle shadow or 1px border in brand-300 at 20% opacity
- Each link: Inter 14px, ink-700, hover state ink-900 with subtle brand-300 underline
- Each link has a small caption description below it (Inter 12px, ink-500):

```
Overview          The architecture and manifesto
Protocols         The clinical IP at the center
Delivery          The instrument that executes
Biologic Control  Prep, recovery, maintenance
Data Intelligence How the system gets smarter
```

**Accessibility:**
- Proper ARIA: `aria-haspopup="true"`, `aria-expanded` toggles
- Keyboard: Tab into "The System", Enter or Space opens, Arrow Down navigates options, Esc closes
- Focus visible on every option

**Mobile pattern:**
- "The System" in the mobile menu becomes a collapsible group header
- Tapping it expands the four sub-links indented below
- Plus an "Overview" link inside the group

---

# ARCHITECTURE DIAGRAM SVG

The closed-loop diagram appears in:
- `/system` Section 4 (the central architecture diagram)
- `/system/data-intelligence` Section 3 (a more detailed variant)

**Design specs:**
- Pure 2D SVG, no animation in this session (animation can be a polish pass later)
- 4 labeled cards arranged in a square layout
- Connecting arrows between them, clockwise
- Brand-300 hairlines for arrows
- Pillar cards: midnight-700 surface with brand-300 border at 30% opacity, rounded corners, padding
- Pillar labels in Fraunces, role descriptions in Inter
- Center label: "The Precise System™" in small Fraunces italic
- Aspect ratio ~16:10, scales responsively

**Reusable component:** `components/marketing/system/ArchitectureDiagram.tsx` — accepts `variant: "main" | "data"` prop to render slightly different versions.

---

# SHARED PATTERNS

To keep the five pages consistent without copy-pasting, build these reusable section primitives:

**`components/marketing/system/PillarHero.tsx`**
The dark hero pattern used at the top of each pillar page. Props: `pillarNumber`, `pillarName`, `tagline`, `lead`.

**`components/marketing/system/PullQuoteSection.tsx`**
The bone-100 editorial section with pull quote left, body right (or vice versa). Props: `pullQuote`, `body` (children), `flip` (boolean), `figNumber`.

**`components/marketing/system/StructuredGrid.tsx`**
The numbered or carded grid pattern used in multiple sections. Props: items array, layout variant.

**`components/marketing/system/PivotLine.tsx`**
The italicized pivot line treatment. Just an `<em>` tag with consistent typography and spacing.

These primitives let the four pillar pages share structure while differing in content.

---

# DRAFTED COPY FLAGS

All copy I've drafted in this spec is flagged for review. Mark in code with `// [DRAFT — pending approval]` comments. Specifically requires sign-off:

- `/system/protocols` — protocol library descriptions, PIH spotlight content
- `/system/delivery` — engineering requirements list, "why a device alone fails" essay
- `/system/biologic-control` — three-stage descriptions, kit contents, Fitz I–VI essay (formulator review)
- `/system/data-intelligence` — closed loop essay, privacy/ethics section (legal review), Roni Bolton naming decision

---

# VERIFICATION

Before declaring done:

1. `npm run build` clean — all 5 new routes generate
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Visit each page on desktop and mobile:
   - Renders correctly
   - All links resolve (sub-page links work)
   - Nav dropdown opens, navigates, closes
   - Architecture diagram renders
5. Lighthouse on each page — 95+ across the board
6. Keyboard navigation through nav dropdown — fully operable
7. Reduced-motion respected (no scroll animations introduced)

## Per-page pre-delivery checklist:

- [ ] Tokens-only
- [ ] Manifesto copy verbatim where applicable
- [ ] Drafted copy flagged
- [ ] No new fonts/icons/colors
- [ ] Console clean
- [ ] System-first voice (no "we" outside the manifesto page)
- [ ] No personalities
- [ ] Fitzpatrick I–VI language correct throughout
- [ ] Prep/recovery/maintenance language correct throughout

---

# DELIVERABLES

When done, report:
1. Production preview URLs for all 5 pages
2. Lighthouse scores for each
3. List of components built (the shared primitives + page components)
4. Roni naming decision flagged for user review
5. All drafted copy flagged for approval
6. Any decisions made not explicit in this spec
7. Any blockers
