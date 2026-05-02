# Session 7 — /pico Product Page

> Run from repo root. Builds the Precise Pico™ product page. Sister to `/system/delivery` (architectural) — this page sells the actual device.

## Setup Before This Session

**Activate skills:**
- `ui-ux-pro-max`
- `frontend-design`

**Read these in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/SESSION-6-SYSTEM-PAGES.md` (for shared primitives reference)
6. This spec

**Reference for visual standard:** the homepage and `/system` pages as currently shipped. /pico must match the editorial polish bar.

---

## Critical Concept: The Pre-Launch Reveal Treatment

The Precise Pico™ device is being unveiled at the August 8, 2026 launch event. **No device photography or 3D render exists yet, and the page should not pretend otherwise.**

Instead, wherever device imagery would normally appear, the slot becomes a **pre-launch reveal moment** — a deliberate visual treatment that says "this is being kept under wraps" rather than reading as missing or unfinished.

### Creative direction delegated to you (Opus)

You have creative control over the reveal treatment's exact visual execution. You're closer to the codebase, the brand's lived visual language, and what's already working in the homepage and /system pages. Use your judgment.

**Constraints (non-negotiable):**

1. **Premium scarcity, not "coming soon" SaaS energy.** The reveal moment should feel like a covered prototype, a draped sculpture, a silhouette behind frosted glass — Apple keynote tease, not a product roadmap card.
2. **Brand palette only.** Midnight, brand-blue, champagne where sanctioned, bone, cream, ink. No new tokens.
3. **Reusable component.** Build it as `components/marketing/pico/RevealPlaceholder.tsx` with props for `aspectRatio`, `tone`, and optional `caption` override. The page uses this component in 2-3 places.
4. **Same dimensions as the eventual real asset.** Build the placeholder at the dimensions a real device shot or 3D render will eventually occupy. Layout stays identical when real assets arrive — swap the component, page stays.
5. **Honors prefers-reduced-motion.** If you build motion into it (subtle ambient drift, glass shimmer, etc.), collapse to static for reduced-motion.
6. **Includes contextual messaging.** Each placement carries a small annotation referencing the launch — "Reveal · August 8, 2026" or "Unveiled at the Civic Opera Building" or similar restraint. Specific copy is your call within voice.

**Possible directions (suggestions, not prescriptions):**

- Silhouette of an abstract device form behind frosted-glass effect (CSS backdrop-filter)
- Geometric outline suggesting the device's form factor in the void
- Soft draped form with subtle texture suggesting "covered under fabric"
- Negative-space silhouette carved out of the section with brand-300 edge glow
- Something else you think is stronger

Pick what reads most premium and most consistent with the brand's existing visual language. **Show your concept before building all three placements** — render the component once at the hero size, screenshot it, get user sign-off, then propagate to the other 2 placements.

---

## Page Structure

8 sections. Top to bottom:

1. Hero — editorial intro + first reveal placeholder
2. Why Pico Exists in the System (architectural context, links to /system/delivery)
3. The Four Wavelengths (technical structured grid)
4. Engineering Specs (full table, real specs)
5. The Practitioner Experience (UI, workflow, integration)
6. What's in the System (Pico-specific kit content)
7. Reveal Moment (second placement of the reveal placeholder, larger)
8. Closing CTA

---

# SECTION SPECS

## SECTION 1 — Hero (midnight-deep)

Editorial hero. The first reveal placeholder lives here.

**Layout:** Two-column on desktop. Left: editorial copy. Right: hero reveal placeholder (4:3 aspect ratio).

```
LEFT COLUMN
Eyebrow: § THE FIRST DEVICE

Display heading (Fraunces, oversized, two lines):
Precise Pico™.
The instrument of the system.

Lead (cream-100, max-w-[44ch]):
A four-wavelength pico laser engineered to execute the Precise 
System protocols with sub-nanosecond precision. Built for predictable 
outcomes across Fitzpatrick I through VI.

CTA row:
[Primary]: Request a demonstration → /demo
[Secondary]: See the system architecture → /system

RIGHT COLUMN
RevealPlaceholder component, aspectRatio="4/3", tone="midnight"
```

Fig. 01 annotation in top-right corner of the section. Subtle gradient/grain on the midnight background matching the homepage hero treatment.

---

## SECTION 2 — Why Pico Exists in the System (bone-100, editorial)

**Purpose:** Establish that Pico is the *current instrument* of the Delivery pillar — not the system itself.

Use the `PullQuoteSection` primitive from Session 6.

```
Pull quote (italic Fraunces, large):
"The device is the instrument, not the system."

Body (drop cap on first paragraph):
[DRAFTED — flag with // [DRAFT]]

Precise Pico is the device that executes the Delivery pillar of 
The Precise System. The system existed first. The protocols, the 
biologic control framework, and the Data Intelligence Layer were 
designed before any hardware was specified. Precise Pico was 
engineered to meet the architectural requirements those decisions 
created — multi-wavelength capability for varied indications, 
sub-nanosecond pulse precision for predictable pigment disruption, 
and parameter calibration tied directly to the protocol library.

A different device could occupy this pillar in the future. Future 
Precise devices will. The architecture stays. The instrument evolves.

Pivot line (italic): The hardware was the last thing we engineered.

Cross-link below body:
"See how delivery fits into the system →" /system/delivery
```

---

## SECTION 3 — The Four Wavelengths (midnight-deep, structured)

**Purpose:** Surface the multi-wavelength capability as the technical signature of the device.

```
Eyebrow: § Fig. 02 — THE WAVELENGTHS

Heading (Fraunces, cream-50):
Four wavelengths.
One instrument.

Lead (cream-100, max-w-[58ch]):
Each wavelength in Precise Pico is calibrated to a category of 
clinical indication. Together, they cover the full spectrum of 
treatable targets — from deep dermal pigment to superficial 
dyschromia to vascular features to textural concerns.
```

Below the heading, a 2x2 or 4-column grid of wavelength cards:

```
CARD 1 — 1064 nm
[Eyebrow: NEODYMIUM YAG]
Headline: 1064 nm
Description: The deepest-penetrating wavelength in the system. 
Targets dermal pigment and tattoo ink without surface absorption — 
making it the workhorse for darker skin types where epidermal 
melanin would absorb shorter wavelengths.
Indications: Deep pigment, black/blue tattoo ink, dermal melasma, 
nevus of Ota, café-au-lait macules

CARD 2 — 532 nm
[Eyebrow: KTP / FREQUENCY-DOUBLED YAG]
Headline: 532 nm  
Description: Strongly absorbed by red, orange, and yellow chromophores. 
The wavelength of choice for superficial pigmented lesions and 
specific tattoo ink colors.
Indications: Lentigines, freckles, café-au-lait macules, red/orange/
yellow tattoo ink, vascular lesions

CARD 3 — 755 nm
[Eyebrow: ALEXANDRITE]
Headline: 755 nm
Description: Optimized for green and blue tattoo ink absorption, 
and effective on epidermal pigment in lighter skin types. Provides 
clinical flexibility for tattoo removal across the spectrum of 
ink colors.
Indications: Green and blue tattoo ink, lentigines on Fitz I–III, 
specific dyschromias

CARD 4 — 785 nm
[Eyebrow: PICOSECOND PRECISION]
Headline: 785 nm
Description: The fourth wavelength extends the device's reach into 
indications that benefit from a balance between depth penetration 
and chromophore selectivity. Calibrated for the Precise protocols 
where 1064 nm and 755 nm together cannot fully address the target.
Indications: Mixed-color tattoo, refractory dyschromias, transitional 
melanin targets

[All four card copy flagged // [DRAFT — clinical review required]]
```

Card visual treatment: midnight-700 surface, 1px brand-300 border at 30% opacity, rounded-lg, padding p-8. Wavelength number in oversized Fraunces brand-300. Eyebrow in tracked Inter cream-300. Description in Inter cream-100. Indications list in small Inter cream-300, comma-separated, no bullets.

---

## SECTION 4 — Engineering Specs (bone-100, structured)

**Purpose:** Full technical spec table. Real values. Shippable now.

```
Eyebrow: § Fig. 03 — ENGINEERING

Heading (Fraunces, ink-900):
Engineering specifications.

Lead (ink-700, max-w-[58ch]):
Precise Pico is engineered to clinical specifications, not consumer 
preferences. The values below are the operating parameters that 
make the protocol library executable with predictable results.
```

Below the heading, a structured spec table. Use a clean technical layout — not a marketing feature grid. Reference: NEJM tables, Stripe documentation tables, Apple technical spec pages.

```
SPEC TABLE — Real values:

CATEGORY: Wavelengths
- 1064 nm (Nd:YAG)
- 532 nm (KTP / Frequency-doubled Nd:YAG)
- 755 nm (Alexandrite)
- 785 nm (Picosecond)

CATEGORY: Pulse Duration
- 450 picoseconds (1064 nm)
- 370 picoseconds (532 nm)  
- 500 picoseconds (755 nm)
- 400 picoseconds (785 nm)

CATEGORY: Maximum Pulse Energy
- 600 mJ (1064 nm)
- 300 mJ (532 nm)
- 200 mJ (755 nm)
- 250 mJ (785 nm)

CATEGORY: Maximum Repetition Rate
- 10 Hz (across all wavelengths)

CATEGORY: Spot Sizes
- 2 mm to 10 mm, adjustable in 1 mm increments
- Specialized fractional handpiece for textural protocols

CATEGORY: Beam Profile
- Flat-top homogenized beam profile
- ±5% energy uniformity across spot

CATEGORY: Cooling System
- Integrated air cooling for handpiece thermal management
- No external chiller required

CATEGORY: Display
- 13-inch capacitive touchscreen
- Protocol library integrated — practitioner selects indication, 
  device loads parameter envelope
- Real-time outcome logging interface (writes to Data Intelligence 
  Layer)

CATEGORY: Connectivity
- Wi-Fi (WPA3) + Ethernet for portal sync
- HIPAA-compliant data transmission
- Practitioner portal session sync

CATEGORY: Dimensions
- 28" W × 24" D × 42" H (console)
- 95 lbs (43 kg)
- Casters with floor lock

CATEGORY: Power Requirements
- 110-240V AC, 50/60 Hz
- 15A dedicated circuit recommended

CATEGORY: Compliance & Certification
- FDA 510(k) cleared (pending — flagged // [REGULATORY — confirm 
  status pre-launch])
- IEC 60601-1 medical device safety
- IEC 60825-1 laser safety Class 4
- HIPAA-compliant data handling

CATEGORY: Warranty
- 24 months parts and labor
- Software updates included for life of device
- Protocol library updates included with practitioner subscription
```

**Visual treatment for the spec table:**
- Two-column layout: category label (left, Inter overline tracked, ink-500), spec values (right, Inter regular, ink-900)
- Subtle 1px hairline divider between rows (ink-100)
- Generous vertical padding per row (py-4)
- Categories grouped with slightly more spacing between groups
- Mobile: stacks to single column, category label above values

**Mark the entire spec table** as `// [DRAFT SPECS — values are realistic industry-standard pico parameters; confirm against final device assembly before launch]`

---

## SECTION 5 — The Practitioner Experience (midnight-deep, editorial)

**Purpose:** Sell the workflow integration, not just the hardware. The Pico isn't just a laser — it's a connected system instrument.

```
Eyebrow: § Fig. 04 — THE WORKFLOW

Heading (Fraunces, cream-50):
Designed for the way protocols are executed.

Lead (cream-100, max-w-[58ch]):
The device interface is built around the protocol library, not 
around hardware controls. Practitioners select the indication. The 
device loads the protocol's parameter envelope. The treatment is 
executed within engineered safety boundaries — and the outcome 
flows back to the Data Intelligence Layer.
```

Below the lead, a numbered list (use the StructuredGrid primitive from Session 6, "numbered" variant):

```
01. Indication selection
The practitioner selects the indication and the patient's Fitzpatrick 
type. The device loads the corresponding protocol from the library.

02. Parameter envelope
The protocol defines the safe operating range — wavelength, fluence, 
pulse duration, spot size — calibrated to the indication and 
skin type. Manual override is available within engineered safety 
boundaries.

03. Treatment execution  
Real-time feedback on pulse count, fluence delivered, and treatment 
zone coverage. Interface designed for minimal cognitive load during 
treatment.

04. Outcome capture
The practitioner logs the treatment outcome at the device or in 
the practitioner portal. The data flows to the Data Intelligence 
Layer, contributing to protocol refinement across the network.

05. Continuous updates
When protocols are updated based on aggregated outcomes, the device 
receives the new version automatically. The next treatment uses 
the refined parameters.
```

**Cross-link below the list:**
"See the Data Intelligence Layer →" /system/data-intelligence

---

## SECTION 6 — What's in the System (bone-100, structured)

**Purpose:** Show the complete Pico-specific package — what arrives when a practitioner buys in.

Use the same numbered card pattern as the homepage "What's Included" section — visual continuity.

```
Eyebrow: § INCLUDED WITH PRECISE PICO™

Heading (Fraunces, ink-900):
What arrives at the practice.

Two-column or single column structured list:

01. Precise Pico™ console
Multi-wavelength pico laser, configured and calibrated.

02. Handpiece set
Standard treatment handpiece + fractional handpiece for textural 
protocols.

03. Protocol library access
All current protocols loaded on the device. Continuous updates via 
practitioner portal sync.

04. Biologic Control starter kit
Prep, recovery, and maintenance kits sufficient for first 30 patient 
treatments.

05. Practitioner portal account
Outcome logging interface, training library access, protocol update 
notifications, anonymized network insights.

06. Onboarding & certification
On-site delivery, installation, and a two-day clinical certification 
program for the practice's clinical team.

07. Annual service & calibration
Year one included. Annual maintenance contract available thereafter.

08. Software & protocol updates
Included for the life of the device.
```

Visual treatment: matches homepage "What's Included" card pattern. ink-700 surface card, brand-300 hairline dividers between items, numbered eyebrow in brand-300, item name in Fraunces, description in Inter ink-700.

---

## SECTION 7 — Reveal Moment (midnight-deep, full-width)

**Purpose:** A second, larger reveal placeholder — the page's emotional crescendo before the closing CTA.

This is the larger placement of the `RevealPlaceholder` component. Full-width section, generous vertical padding, centered.

```
Eyebrow (champagne-200, centered): § THE UNVEILING

Heading (Fraunces, cream-50, italic, oversized, centered, max-w-[20ch]):
Precise Pico™ is unveiled at the launch event.

Body (cream-100, centered, max-w-[52ch]):
By invitation only. Civic Opera Building, Chicago. August 8, 2026.

[RevealPlaceholder component — large, centered, aspectRatio="16/9" 
or similar dramatic ratio]

CTA below the placeholder:
[Primary, champagne]: Request an invitation → /launch
```

This section uses the third sanctioned champagne moment on the page (eyebrow + CTA button — within budget).

---

## SECTION 8 — Closing CTA (bone-100)

**Purpose:** Convert. End the page on the demo ask.

```
Eyebrow: § READY TO SEE THE INSTRUMENT

Heading (Fraunces, ink-900, centered, max-w-[18ch]):
Schedule a demonstration.

Body (ink-700, centered, max-w-[52ch]):
Demonstrations begin at launch. Practitioners interested in 
Precise Pico™ and the full Precise System can reserve a slot now.

CTA row, centered:
[Primary, lg]: Request a demonstration → /demo
[Secondary inline]: Or get launch updates → #updates
```

---

# SHARED PRIMITIVES (NEW + REUSED)

**Reuse from Session 6:**
- `PivotLine.tsx`
- `PullQuoteSection.tsx`
- `StructuredGrid.tsx`
- `PillarHero.tsx` (light adaptation may be needed for product-page register)

**New for this session:**

**`components/marketing/pico/RevealPlaceholder.tsx`**
Props:
- `aspectRatio: "4/3" | "16/9" | "1/1"` (string token, drives container)
- `tone: "midnight" | "bone"` (drives surface color and text color)
- `caption?: string` (optional override; default copy auto-selects based on tone)

Creative execution: your call (per the section above). Show concept first, propagate after sign-off.

**`components/marketing/pico/SpecTable.tsx`**
Renders the Section 4 spec table. Server Component, takes a structured data object as props. Two-column desktop layout, single-column mobile stack.

**`components/marketing/pico/WavelengthCard.tsx`**
Renders one of the four wavelength cards in Section 3. Props: `wavelength`, `eyebrow`, `description`, `indications` (string[]).

---

# DRAFTED COPY FLAGS

All copy I've drafted is `// [DRAFT — pending approval]` until reviewed:

- Section 2 — "Why Pico Exists in the System" essay
- Section 3 — All four wavelength card descriptions and indications
- Section 4 — All spec table values (real-world realistic, but require confirmation against actual device)
- Section 5 — Workflow numbered list copy
- Section 6 — "What's Included" item descriptions
- Section 7 — Unveiling section copy

**Mark Section 4 specs especially:** These are realistic industry-standard pico parameters but the actual device may differ. Flag for assembly-time review.

**Mark FDA 510(k) status:** flagged for regulatory confirmation before launch.

---

# VERIFICATION

Before declaring done:

1. `npm run build` clean — /pico route generates
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Visit /pico:
   - All 8 sections render in order
   - RevealPlaceholder renders at correct dimensions in both placements (Section 1 + Section 7)
   - Spec table reads cleanly on desktop and mobile
   - Cross-links work (/system/delivery, /system/data-intelligence, /system, /demo, /launch, #updates)
5. Nav dropdown:
   - "Precise Pico" link in nav goes to /pico
   - If "Precise Pico" isn't currently in the nav, add it — it sits at the top level (not under "The System" dropdown), parallel to the System dropdown
6. Lighthouse on production build — 95+ all metrics
7. Keyboard nav through page — all CTAs reachable, focus visible
8. Reduced-motion respected — RevealPlaceholder static if it has motion

---

## Per-page pre-delivery checklist:

- [ ] Tokens-only
- [ ] No new fonts/icons/colors
- [ ] Console clean
- [ ] System-first voice (Pico is the instrument, not the system)
- [ ] No personalities
- [ ] Fitzpatrick I–VI language correct
- [ ] Prep/recovery/maintenance language correct (Section 6)
- [ ] Trademark on first appearance only (Precise Pico™ first, then Precise Pico)
- [ ] Champagne sanctioned only at Section 7 (max 2 uses on page: eyebrow + CTA)
- [ ] RevealPlaceholder concept approved before propagation
- [ ] All drafted copy flagged

---

# DELIVERABLES

When done, report:
1. Production preview URL for /pico
2. Lighthouse scores (mobile + desktop)
3. RevealPlaceholder concept screenshot for sign-off (BEFORE building all placements)
4. Components built (the new + reused primitives)
5. All drafted copy flagged for approval
6. Any decisions made not explicit in this prompt
7. Any blockers
