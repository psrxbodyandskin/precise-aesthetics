# Session 5 — Full Homepage Build

> Run from repo root after the 3D hero (Pass 5 final state) is committed.

## Setup Before This Session

**1. Install 21st.dev Magic MCP for component generation:**

```bash
npx mcpbar@latest install 21st-dev/magic-mcp -c claude
```

Confirm the MCP is connected before starting. Magic helps generate polished UI components (cards, callouts, comparison sections, testimonials) — use it for component scaffolds, then refine to match MASTER.md tokens.

**2. Activate skills throughout this session:**
- `ui-ux-pro-max` — design intelligence and best practices
- `frontend-design` — component composition patterns

## Context

You have already read `CLAUDE.md`, `design-system/MASTER.md`, `design-system/BRAND-IDENTITY.md`, `design-system/COPY-DECK.md`. The teaser hero (with 3D Convergence visualization) is built and committed. This session builds out the full homepage — everything else.

**This is the most important page in the build.** The site lives or dies by this page. Treat the polish standard accordingly.

---

## Goal

A full, premium-grade homepage that reads as clinical tech, not medspa, not biotech, not generic SaaS. Reference standard: Stripe (clarity), Linear (craft), Apple Pro (premium tech), Aesop (warmth + restraint), NEJM (authority).

8 sections, top to bottom:

1. Hero (existing, with 3D)
2. Thesis
3. The Four Pillars (deep)
4. Outcomes
5. For Practitioners
6. Launch
7. Demo CTA
8. Footer (existing)

Each section has its own visual tone, rhythm, and reason to exist. None feel like filler.

---

## Critical Constraints

- **MASTER.md tokens only.** No new colors, no new fonts, no off-system anything.
- **COPY-DECK.md verbatim where indicated.** New copy must be approved before shipping — flag any drafted copy with `[DRAFT]` for review.
- **Use Session 3 primitives.** `<Section>`, `<DisplayHeading>`, `<Heading>`, `<Lead>`, `<BodyText>`, `<Eyebrow>`, `<Button>`, `<Logo>`. Don't reinvent.
- **No new icon libraries.** Lucide only.
- **Server Components by default.** Client only when needed (form, animation, scroll-tracked elements).
- **Lighthouse 95+ on every metric.** Performance, A11y, Best Practices, SEO. Non-negotiable.
- **WCAG 2.2 AA.** Verified on every section.

---

## CTA Strategy (Hybrid, Demo-Forward)

The launch is August 8, 2026 — roughly 3 months out. The site ships now with launch-mode CTAs already in place:

**Primary CTA across the page:** "Request a demonstration"
- Books real Cal.com slot
- Calendar shows post-launch demo availability
- Form captures full practitioner info → Supabase `demo_requests` table

**Secondary CTA:** "Get launch updates"
- Lightweight email capture for those not ready to commit
- Existing teaser flow (keep working, don't break)
- Reuses existing `LeadForm` component

**Hierarchy:**
- Hero: primary CTA dominant, secondary as smaller text link
- Mid-page: primary CTA repeated
- Final section: primary CTA full-width, secondary inline below

---

# SECTION SPECS

## SECTION 1 — Hero (existing, do not rebuild)

The 3D Convergence hero is committed. Don't touch the 3D component, the canvas, the framing brackets, or the existing copy. Confirm hero CTAs are:

- Primary: "Request a demonstration" → scrolls to or links `/demo`
- Secondary: "Get launch updates" → scrolls to launch updates form anchor

If currently set to teaser CTAs ("Get launch updates" as primary), update to launch-mode hierarchy above.

---

## SECTION 2 — Thesis

**Tone:** `bone-100` background. Quiet, editorial, anchoring.

**Purpose:** Tell the brand thesis in plain language. The "why this exists" moment.

**Layout:** Single column, centered, `containerWidth="prose"` (max 720px). Generous vertical padding (py-32 desktop).

**Content:**

```
[Eyebrow]   WHY THE SYSTEM EXISTS

[DisplayHeading md, balance, max-w-[20ch]]
Built for the patients
the industry has historically
struggled to treat.

[Lead, max-w-[58ch]]
Most pico systems were optimized for the easiest cases. The Precise 
System™ was engineered for Fitzpatrick IV, V, and VI — where 
post-inflammatory hyperpigmentation, complication risk, and protocol 
inconsistency have made laser dermatology unreliable.

[BodyText, max-w-[58ch]]
We changed the inputs. The outcomes followed.
```

**Visual notes:**
- Headline in Fraunces, ink-900, line-height 1.05
- Lead in Inter, ink-700, 20px, line-height 1.5
- The final line "We changed the inputs. The outcomes followed." gets its own paragraph treatment with slight top margin (mt-6) — reads as the punctuation
- Subtle `brand-500` hairline (60px wide, 1px) above the eyebrow, centered

---

## SECTION 3 — The Four Pillars Deep Dive

**Tone:** `midnight-deep` background. Premium, technical, dense with substance.

**Purpose:** Each pillar gets its own moment. This is where the "system architecture" claim earns its weight.

**Layout:** Vertical sequence of four pillar blocks. Each block is a 12-column grid, alternating left/right composition for editorial pacing.

```
Block 1 (Protocols)         — left: text   | right: visual
Block 2 (Delivery)          — left: visual | right: text
Block 3 (Biologic Control)  — left: text   | right: visual
Block 4 (Data Intelligence) — left: visual | right: text
```

**Section header (above the blocks):**

```
[Eyebrow, brand-300]   THE PRECISE SYSTEM

[DisplayHeading lg, cream-50, max-w-[18ch]]
Four pillars.
One closed loop.

[Lead, cream-100, max-w-[58ch]]
A laser alone produces inconsistent results. A protocol without 
biologic control produces complications. A device without outcome 
data can't improve. The Precise System closes the loop — device, 
protocol, biologic control, and data — so every session refines 
the next.
```

**Each pillar block contains:**

```
[Pillar Number — 01, 02, 03, 04]   Large Fraunces, brand-300, italic-leaning
[Pillar Name]                       Fraunces 36px, cream-50
[Pillar Description]                Inter 17px, cream-100, max-w-[52ch]
[Key Features (3 bullets)]          Inter 15px, cream-100, with subtle Lucide icons (CheckCircle2, line-icon)
[Visual]                            Either:
                                    - A small focused 3D render (extracted single pillar from hero)
                                    - A subtle abstract illustration in brand colors
                                    - A clinical detail image (placeholder for now)
```

**Pillar 1 — Protocols**
```
01

Protocols
The medicine, not just the laser.

The protocol library is the proprietary clinical IP that sits at 
the heart of the system. Indication-specific frameworks, including 
the PIH Prevention Protocol™ — engineered for safety on Fitzpatrick 
IV–VI from the first pulse.

· Indication-specific clinical frameworks
· PIH Prevention Protocol™ for darker skin types
· Continuously refined through real-world treatment data

[Link, with arrow]: See the protocol library →   /protocols
```

**Pillar 2 — Delivery Mechanism**
```
02

Delivery Mechanism
Engineered to execute the protocol.

The device is the instrument. Multi-wavelength pico delivery 
engineered to execute the protocol with precision. Hardware exists 
to serve the protocol — not the other way around.

· Four wavelengths — 532nm, 1064nm, 755nm, 785nm
· Sub-nanosecond pulse precision
· Engineered to clinical specifications, not consumer preferences

[Link]: Meet Precise Pico™ →   /pico
```

**Pillar 3 — Biologic Control**
```
03

Biologic Control
Healing is part of the protocol.

Pre- and post-treatment kits engineered to optimize healing, reduce 
complication risk, and stabilize outcomes across skin types. Biologic 
control isn't an upsell — it's a pillar.

· Pre-treatment skin priming
· Post-treatment recovery support
· Engineered for Fitzpatrick IV–VI tolerance

[Link]: Inside Biologic Control →   /system/biologic-control
```

**Pillar 4 — Data Intelligence Layer**
```
04

Data Intelligence Layer
Every session makes the system smarter.

Real-world treatment outcomes feed back into protocol refinement 
through the Data Intelligence Layer. Practitioners log outcomes, 
the system learns. Every cycle gets sharper.

· De-identified outcome tracking
· Aggregate pattern detection
· Protocol updates informed by real outcomes

[Link]: Inside the Data Intelligence Layer →   /system/data-intelligence
```

**Visual treatment between blocks:**
- Thin `brand-300` hairline divider (1px, 30% opacity) between each block, centered, 80px wide
- Subtle vertical breathing space (py-20 between blocks)

---

## SECTION 4 — Outcomes

**Tone:** `bone-100` background. Editorial, evidence-led, anchoring.

**Purpose:** The data-driven results story. The wedge made tangible.

**Layout:** Mixed — opening statement + outcome callouts in a 3-column grid + a closing paragraph.

```
[Eyebrow]   THE OUTCOMES

[DisplayHeading md, balance, max-w-[20ch]]
Predictable on
Fitzpatrick IV through VI.

[Lead, max-w-[58ch]]
The reason the system exists is the result. Engineered protocols, 
biologic control, and outcome tracking — together — produce 
consistency where the industry has historically failed.
```

**Outcome callout cards (3 cards, grid):**

```
Card 1 — PIH Prevention
[Icon: ShieldCheck, brand-500]
~95%
Reduction in post-inflammatory 
hyperpigmentation events vs 
standard pico protocols
[caption, Inter 13px, ink-500]
Internal protocol data, n=247

Card 2 — Treatment Predictability  
[Icon: Target, brand-500]
4×
More predictable session-to-session 
outcomes across skin types
[caption]
Aggregate practitioner data

Card 3 — Continuous Refinement
[Icon: Activity, brand-500]
∞
Every session contributes to the 
data layer that refines the next
[caption]
Continuously updated
```

**Note for these stats:** [DRAFT] flag — these are illustrative numbers. Real numbers need clinical sign-off before launch. Build the cards with placeholders, mark them `[CLINICAL DATA — PRE-LAUNCH SIGN-OFF REQUIRED]` in code comments. Use the Magic MCP for the card component scaffold — refine to brand tokens.

**Closing paragraph (below the cards):**

```
[BodyText, ink-700, max-w-[58ch], centered]
Real-world treatment data continuously refines the protocol library. 
Every practitioner using the system contributes to the next 
practitioner's better outcomes.
```

---

## SECTION 5 — For Practitioners

**Tone:** `midnight` (slightly lighter than midnight-deep). Direct, practical, B2B-focused.

**Purpose:** Speak directly to the buyer. What do they get? Why does this matter to their practice?

**Layout:** Two-column on desktop. Left: editorial intro. Right: structured "what's included" callout block.

```
LEFT COLUMN
[Eyebrow, brand-300]   FOR PRACTITIONERS

[DisplayHeading md, cream-50, max-w-[16ch]]
A complete clinical 
system — not just 
a capital purchase.

[Lead, cream-100, max-w-[44ch]]
Practitioners who buy into the Precise System get the device, the 
protocols, the biologic control kits, and access to the practitioner 
portal — where outcome data, training, and protocol updates live. 
The system grows with the practice.

[Button, primary]: Request a demonstration   /demo
[Link, secondary]: See practitioner portal preview   /portal-preview

RIGHT COLUMN — "What's Included" callout
[Card, midnight-700 background, brand-300 border at 20% opacity, rounded]

INCLUDED IN THE SYSTEM
─────────────────────────────────

01  Precise Pico™ device
    Multi-wavelength pico delivery system

02  Protocol Library access
    All indications, including PIH Prevention

03  Biologic Control starter kit
    Pre- and post-treatment supplies

04  Practitioner Portal account
    Outcome logging, training, updates

05  Onboarding & certification
    Provisioned at delivery

06  Data Intelligence access
    Anonymized aggregate insights from your sessions
```

**Visual treatment:**
- Each numbered item: small Inter overline number in brand-300, then Fraunces 18px name, then Inter 14px caption
- Subtle hairline divider between each item (1px, brand-300 at 10% opacity)
- The card lifts slightly on the page (subtle shadow on midnight is hard — use a 1px brand-300 border at 25% opacity instead)

---

## SECTION 6 — Launch

**Tone:** `midnight-deep` background. Premium, anticipatory, scarce.

**Purpose:** The launch event. By invitation. August 8, 2026.

**Layout:** Centered, dramatic, single column. `containerWidth="default"` but constrained content widths.

```
[Eyebrow, champagne-200]   BY INVITATION

[DisplayHeading lg, cream-50, max-w-[16ch], centered]
The Precise System
launches August 8, 2026.

[Lead, cream-100, max-w-[52ch], centered]
An evening of clinical demonstrations and conversation at the Civic 
Opera Building, Chicago. Attendance is by invitation only.

[Visual element, centered]
A subtle decorative element — could be:
- A small champagne-tinted brand mark
- A thin hairline frame around the date in Fraunces oversized
- Or a minimal RSVP card-style component

Suggestion: Use Magic MCP to scaffold an "invitation card" component, 
then refine. The card should feel premium — bone-100 surface against 
the midnight-deep section, champagne hairline border, Fraunces date 
typeset large.

[Button, champagne]: Request an invitation   /launch
```

**Champagne is sanctioned here.** This section is the brand's wax-seal moment on the page. Use champagne in the eyebrow, the CTA button, and any decorative accent. Don't overdo it — three uses max.

---

## SECTION 7 — Demo CTA

**Tone:** `bone-100` background. Direct, action-oriented, no decoration.

**Purpose:** The conversion. End the page on the ask.

**Layout:** Centered, focused, generous padding.

```
[Eyebrow]   READY TO SEE THE SYSTEM

[DisplayHeading md, ink-900, max-w-[18ch], centered]
Schedule a 
demonstration.

[Lead, ink-700, max-w-[52ch], centered]
We work with practitioners across dermatology, plastic surgery, 
and aesthetic practices. Demonstrations begin at launch. Reserve 
your slot now.

[Button row, centered]
[Button, primary, lg]: Request a demonstration
[Link, secondary inline]: Or get launch updates →

[Trust microcopy below CTAs, Inter 13px, ink-500, centered]
We respond within 1 business day. No sales pressure.
```

The demo CTA can either:
- Link to `/demo` (a separate page with full Cal.com embed) — cleaner architecture
- Open a Cal.com modal directly inline — fewer clicks but heavier

**Recommendation:** link to `/demo` for now. Build the actual `/demo` page in this session as a sub-deliverable (Section spec below).

---

## SECTION 8 — Footer (existing, verify only)

The footer is built (Session 3). Verify:
- Renders correctly at the end of the page
- All links resolve (some pages don't exist yet — those should 404 cleanly with the branded 404 page)
- Newsletter capture works
- Copyright year correct
- Trademark line includes The Precise System™

---

## SUB-DELIVERABLE — `/demo` page

Build a minimal `/demo` page that the homepage CTAs link to:

**Route:** `/demo`

**Page structure:**
1. Brief hero (smaller than homepage hero, no 3D)
   - Eyebrow: "REQUEST A DEMONSTRATION"
   - Headline: "See the system. Schedule with our team."
   - Lead: brief paragraph about what to expect
2. Cal.com embed (or placeholder if Cal.com not set up yet)
3. Or a direct demo request form (RHF + Zod, similar to LeadForm but with more fields):
   - First name, Last name, Email, Phone
   - Practice name, Role, Practice type
   - State, Current devices
   - Monthly treatment volume (bucket select)
   - Primary interest (checkboxes: tattoo, melasma, PIH, scars, rejuvenation)
   - Timeline (now / 30 days / 60-90 days / exploring)
   - Notes
4. Submission writes to Supabase `demo_requests` table (already exists from Session 2)
5. Sends Resend confirmation email + internal notification
6. Same hybrid approach as `/api/lead`

**For Cal.com:** If Cal.com isn't set up yet (likely), use the form approach. Cal.com integration can be a separate later session — flag it.

---

## DESIGN POLISH STANDARDS

This page has to read as superior. Specific things to obsess over:

### Typography
- Headlines never wrap to single-word lines
- Display headings hit 2-3 lines max via `text-balance` and proper `max-w-[Xch]`
- Body line lengths capped at 60-72ch
- Eyebrows always tracked 0.12em+ in ALL CAPS
- ™ symbols never superscript — inline, full size

### Color
- Bone sections feel warm, never sterile (warmth comes from `bone-100` not pure white)
- Midnight sections have variation — use `midnight-700` for secondary backgrounds within `midnight-deep` sections (cards, callouts)
- Brand-blue (brand-300, brand-500) used as accent, never as section fills
- Champagne strictly sanctioned — Launch section, demo CTA hover-state moments only

### Spacing
- Section vertical padding: `py-32` desktop, `py-20` mobile
- Hero retains existing padding
- Section-to-section transitions: hard, no fades or gradients between sections

### Imagery
- No placeholder photos that look like stock medspa imagery
- Where photos belong but don't exist yet: use bone or midnight colored blocks with caption "[IMAGE: description, pending]"
- The 3D hero is the only visual flex — the rest of the page earns its weight through typography, layout, and color

### Motion
- No scroll-triggered fade-ins on section content
- Hover states on links: 150ms color transition, no underline animation gymnastics
- The 3D hero is the only animation on the page
- Reduced-motion respected throughout

### Component generation via Magic MCP
- Use Magic for: card scaffolds, callout components, comparison tables, the launch invitation card
- After Magic generates, ALWAYS refine to MASTER.md tokens. Magic generates Tailwind defaults — strip and replace with brand tokens.
- Don't accept Magic output that uses non-brand colors, unfamiliar typography, or icons outside Lucide

---

## VERIFICATION CHECKLIST

### Before declaring this session complete:

1. `npm run build` clean — all routes build
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Visit `/` on desktop:
   - All 8 sections render in order
   - Each section has its own visual identity
   - Hero (with 3D) still works
   - All CTAs route correctly
5. Visit `/` on mobile (375px):
   - Stacks correctly
   - 3D collapses to static fallback
   - All sections readable
   - CTAs reachable
6. Visit `/demo`:
   - Form renders, validates, submits
   - Submission writes to Supabase
   - Resend confirmation email arrives
7. Lighthouse on production build:
   - Performance ≥ 95
   - Accessibility = 100
   - Best Practices ≥ 95
   - SEO = 100
8. Tab through entire page keyboard-only:
   - Focus visible on every interactive element
   - All forms operable
   - Skip-to-content works
9. `prefers-reduced-motion` respected:
   - 3D collapses to static
   - All other content static (no scroll fades)

### Per-section pre-delivery (run after each section):

- [ ] Reads from MASTER.md tokens only
- [ ] No new fonts, icons, or colors
- [ ] Responsive at 375 / 768 / 1024 / 1440
- [ ] Keyboard accessible
- [ ] Body contrast ≥ 4.5:1 (verify on each tone change)
- [ ] No console errors or warnings
- [ ] Section feels editorial, not templated
- [ ] Copy reads as system-first, not device-first
- [ ] No personality references (no founder bios, no team headshots)

---

## DRAFTED COPY FLAGS

The following copy is drafted by me and needs review before shipping:

- All four pillar names + descriptions + features (Section 3)
- The PIH Prevention Protocol™ outcome statistics (Section 4) — clinical sign-off required
- Treatment predictability stats (Section 4) — clinical sign-off required
- "What's Included" item descriptions (Section 5)
- Demo CTA microcopy "We respond within 1 business day. No sales pressure."

Mark these with `// [DRAFT — pending approval]` comments in code so they're easy to find later.

---

## DO NOT IN THIS SESSION

- Do not rebuild the hero (it's done, locked, committed)
- Do not change the 3D component
- Do not add Cal.com integration if it's not already set up (flag for later session)
- Do not commission or generate hero photography
- Do not create personality-led content (no founders, no clinical director, no team)
- Do not introduce new design tokens, fonts, or icon libraries
- Do not add scroll-triggered animation
- Do not make subtle gradients between sections (transitions stay hard)

---

## DELIVERABLES

When done, report:
1. Production preview URL where the homepage and `/demo` are live
2. Lighthouse scores (mobile + desktop) for `/`
3. Lighthouse scores for `/demo`
4. Confirmation a real demo request submission flows through the full pipeline
5. List of components generated via Magic MCP and how each was refined
6. Any decisions made not explicit in this prompt
7. Any drafted copy that needs your sign-off before final ship
8. Any blockers

After this session, the next steps are:
- `/system` page and sub-pages
- `/pico` product page  
- `/protocols` (public marketing of the gated library)
- `/about` (company-level, no personalities)
- `/contact`, `/press`, `/launch` standalone pages
- Practitioner portal build
- Final pre-launch QA pass
