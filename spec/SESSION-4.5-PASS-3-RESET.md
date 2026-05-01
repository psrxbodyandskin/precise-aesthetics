# Pass 3 — Full Concept Reset: "System Activation Flow"

> Replaces all prior Pass 1/2 work. This is a directional reset — the four-shape orbit concept is abandoned. The new concept is a flow visualization: four meaningful pillar objects on pedestals, connected in a clockwise loop by glowing arrow paths, with sequential activation animating around the closed loop.

## Activate Skills

Use `ui-ux-pro-max` for 3D UI best practices, performance patterns, and accessibility. Reference `frontend-design` skill for component composition.

Read these before starting:
- `CLAUDE.md`
- `design-system/MASTER.md`
- `design-system/BRAND-IDENTITY.md`
- `design-system/COPY-DECK.md`
- This spec

---

## Concept Reference

The user's references (4 ideation images, image 7A specifically) showed four meaningful objects on platforms in a closed-loop arrangement with flowing arrows between them. We're matching that compositional framework but executing in the Precise brand palette on a midnight background.

**Reference framework (image 7A direction):**
- Each pillar = a meaningful object on a small pedestal
- Pedestals arranged in a clockwise loop
- Arrows flow between them
- Reads instantly as "system with parts that work together"
- Premium, clinical, gallery-quality

**Our adaptation:**
- Midnight scene (not bone like 7A) — matches our hero section background
- Brand palette only — no generic blues, no purple, no gradient cliches
- Brand-blue + champagne accents only
- Sequential clockwise activation (one pillar at a time)

---

## Scene Composition

### Camera

- `PerspectiveCamera`, FOV 35°
- Position: `[0, 1.5, 6.5]` — slightly elevated, looking down at the loop arrangement
- Target: `[0, 0, 0]`
- Mouse parallax: ±5° on Y, ±3° on X (from Pass 1)

### Layout

The four pedestals sit in a clockwise loop around a shared center. Slightly elevated camera so you see them as a circle from a perspective angle (not flat top-down, not flat side).

**Pedestal positions** (top-down coordinates, all on Y=0 ground plane):

| Pillar | Position (X, Z) | Faces |
| --- | --- | --- |
| Protocols (1 — top-left) | `[-1.4, 0, -0.8]` | toward center |
| Delivery Mechanism (2 — top-right) | `[1.4, 0, -0.8]` | toward center |
| Data Intelligence (3 — bottom-right) | `[1.4, 0, 0.8]` | toward center |
| Biologic / Skin Kits (4 — bottom-left) | `[-1.4, 0, 0.8]` | toward center |

Arrows flow clockwise: Protocols → Delivery → Data → Biologic → Protocols.

### Pedestals

Every object sits on a small circular pedestal:
- `CylinderGeometry(radius=0.55, radius=0.55, height=0.08, segments=64)` — flat disc, slight thickness
- Material: `MeshPhysicalMaterial`, color `#1F2A3D` (ink-700), roughness 0.3, metalness 0.05, clearcoat 0.6
- Subtle rim glow: thin emissive ring around the top edge of the pedestal in `brand-300` at low intensity

The pedestal is the gallery plinth. It frames each pillar object as something important.

---

## The Four Pillar Objects

Each one needs to feel rich, meaningful, branded. NOT generic primitives. NOT placeholder shapes.

### 1. Protocols — Layered Curved Panels

**Reference:** Image 7A's Protocols object (translucent curved panels stacked).

**Geometry:**
- Three curved panels (think pages of a manuscript) stacked with depth
- Each panel: a rectangular plane curved into a 30° arc (use `BufferGeometry` with curved vertices, or `PlaneGeometry` with vertex displacement)
- Panel size: 0.9 wide × 0.7 tall × very thin
- Three panels stacked along the Z-axis: front panel, middle panel (offset back 0.15), rear panel (offset back 0.30)
- Each panel rotated very slightly differently (~3° around vertical axis) so the stack reads as "layered, considered"

**Material:** Frosted glass effect
- `MeshPhysicalMaterial`
- Color: `#A8C8E8` (brand-300), with `transmission: 0.85`, `roughness: 0.15`, `thickness: 0.5`, `ior: 1.4`
- Slight emissive `#A8C8E8` at very low intensity (0.15)
- Result: translucent panels that catch and refract light

**Subtle detail:** thin horizontal lines etched into each panel surface (using line geometry overlaid) — suggests "text on a manuscript page" without being literal text.

**Idle motion:** group rotates very slowly on Y-axis (1 rotation per 30 seconds).

### 2. Delivery Mechanism — Upright Monolith Device

**Critical:** This represents the laser device. NOT a pill, NOT a capsule, NOT a sphere. An upright rectangular form with a screen face.

**Geometry:**
- `RoundedBoxGeometry(width=0.5, height=0.85, depth=0.45, radius=0.05, segments=4)` — taller than wide, suggesting a small device
- Front face has a recessed inset: another smaller `RoundedBox` representing the screen, positioned slightly inset on the front face, with emissive material
- Top of the device has a subtle detail (a small notch, vent, or stylized emitter) hinting at "this is the working end"

**Materials (two parts):**
- Body: `MeshPhysicalMaterial`, color `#0C1426` (midnight-800), roughness 0.25, metalness 0.4, clearcoat 0.85, clearcoatRoughness 0.1 — polished dark device finish
- Screen face: `MeshBasicMaterial` with emissive properties — color `#A8C8E8` at low intensity (0.4) idle, brightens to 1.0 during activation phase. Suggests "screen is on"

**Idle motion:** very subtle rotation on Y-axis (~1 rotation per 60 seconds). Slow enough you barely notice — adds life without distraction.

### 3. Data Intelligence Layer — Glowing Torus with Particle Stream

**Reference:** Image 7A's Data object (translucent torus with light particles flowing around it).

**Geometry:**
- `TorusGeometry(radius=0.4, tube=0.06, radialSegments=64, tubularSegments=128)` — full ring, NOT a fragment
- Oriented horizontally (lying flat) — so it reads as "data orbit"
- A second, slightly larger torus inside the first as a subtle layered effect

**Material:**
- Main torus: `MeshPhysicalMaterial`, color `#5891CA` (brand-500), `transmission: 0.6`, `roughness: 0.2`, emissive `#A8C8E8` at intensity 0.4
- Slight rim glow

**Particle stream:** This is the signature detail.
- 80–120 small particles travel along the torus path on a continuous loop
- Each particle: tiny `Points` or `InstancedMesh` of small spheres (radius 0.012)
- Color: `#A8C8E8` (brand-300) with `additive blending` for glow
- Particles travel at slightly different speeds along the ring (creates organic feel, not mechanical sync)
- Implementation: parametric position along the torus, `t = (initialOffset + speed * elapsedTime) % 1`

**Idle motion:** torus itself slowly rotates on Y-axis (1 rotation per 20 seconds). Particles continue streaming continuously.

### 4. Biologic Control / Skin Product Kits — Cluster of Small Containers

**Reference:** Image 7A's Skin Product Kits (cluster of small bottles/jars).

**Geometry:**
A small group of 5–7 cylindrical containers of varying heights and widths, clustered on the pedestal:
- `CylinderGeometry(0.10, 0.10, 0.32)` — tall slim bottle
- `CylinderGeometry(0.14, 0.14, 0.20)` — squat jar
- `CylinderGeometry(0.08, 0.08, 0.28)` — narrow vial
- `CylinderGeometry(0.12, 0.12, 0.16)` — small wide jar
- `CylinderGeometry(0.09, 0.09, 0.24)` — medium bottle
- Plus 1–2 smaller accent containers

Each has a small "cap" detail on top: a thin disc of contrasting color (`#E8DCC4` champagne) — these are the lids of the skincare jars.

**Materials:**
- Bottles: `MeshPhysicalMaterial`, color `#F4F0E8` (cream-100), roughness 0.3, metalness 0.1, clearcoat 0.7 — premium opaque ceramic feel
- Caps: `MeshPhysicalMaterial`, color `#E8DCC4` (champagne-200), metalness 0.7, roughness 0.2, clearcoat 0.5 — subtle metallic luxury

**Idle motion:** cluster as a whole rotates on Y-axis (1 rotation per 40 seconds). Individual bottles stay in fixed positions within the cluster.

**This is where champagne lives** — these jars have champagne caps. That's the brand's wax-seal moment. Don't let champagne appear elsewhere except the activation light.

---

## Connecting Arrows (The System Flow)

This is what shows the closed loop. Without these, it's just four objects.

**Geometry:**
Curved tube paths between pedestals, not straight lines. Each arrow:
- A `TubeGeometry` along a curved path from one pedestal to the next
- Path uses a `QuadraticBezierCurve3` with the control point arcing outward (so arrows curve gracefully rather than going through the center)
- Tube radius: 0.025 (thin, elegant)
- Tube radial segments: 8

**Idle state (system off):**
- Material: `MeshBasicMaterial`, color `#1F2A3D` (ink-700), opacity 0.4
- Barely visible — just structural hints that connections exist

**Active state (during activation phase):**
- Material switches to glowing brand-blue
- Color: `#A8C8E8` (brand-300) with emissive intensity 1.0
- Animated pulse traveling along the tube using a custom shader OR a moving particle flowing along the path

**Arrow heads:**
- Small triangular cone at the destination end of each arrow
- `ConeGeometry(0.06, 0.12)`
- Same material state (dim → glowing) as the tube

The four arrows: Protocols→Delivery, Delivery→Data, Data→Biologic, Biologic→Protocols.

---

## The Activation Sequence (12-second loop)

This is the moment everyone watches for. Tight choreography.

```
0.0 – 1.5s    System dim. All four pedestals visible. Pillar objects 
              glow at low ambient (0.2 intensity). Arrows are dim. 
              Each pillar continues its idle rotation.

1.5 – 2.5s    PROTOCOLS pillar ignites. Its panels brighten 
              (emissive intensity 0.15 → 0.7). Pedestal rim glow 
              brightens. Holds bright.

2.5 – 3.5s    Arrow PROTOCOLS → DELIVERY ignites. Glowing pulse 
              travels along the tube from Protocols to Delivery 
              (light particle moves along the path). Tube material 
              brightens during the pulse, fades back slightly after 
              the pulse passes. Arrow head at Delivery end blinks 
              champagne briefly (50ms) when pulse arrives.

3.5 – 4.5s    DELIVERY pillar ignites. Screen face emissive 
              brightens (0.4 → 1.0). Body picks up rim light. 
              Pedestal rim glow brightens. Holds bright.

4.5 – 5.5s    Arrow DELIVERY → DATA ignites. Same pulse mechanic. 
              Arrow head at Data end blinks champagne when pulse 
              arrives.

5.5 – 6.5s    DATA pillar ignites. Particle stream around the torus 
              accelerates and brightens. Torus emissive intensity 
              jumps. Pedestal rim glow brightens.

6.5 – 7.5s    Arrow DATA → BIOLOGIC ignites. Same mechanic. 
              Champagne blink at Biologic.

7.5 – 8.5s    BIOLOGIC pillar ignites. The bottles glow softly, 
              their champagne caps gleam brighter. Pedestal rim 
              glow brightens.

8.5 – 9.5s    Arrow BIOLOGIC → PROTOCOLS ignites — completing the 
              loop. Champagne blink at Protocols. The full circuit 
              is now lit and visible as a complete flowing system.

9.5 – 11.0s   FULL SYSTEM ALIVE — all four pillars at peak glow, 
              all four arrows flowing with continuous pulses 
              traveling around the loop, the whole composition 
              radiating subtle light. This is the "wow" hold. 
              Center of the loop has a soft champagne ambient light 
              that fades up here.

11.0 – 12.0s  All emissive intensity fades smoothly back to ambient 
              dim. Arrows return to dim ink-700. Pillar pedestals 
              return to low rim glow. System resets to start state.

Loop continues.
```

### Implementation Notes

- Use `useFrame` from `@react-three/fiber` to drive the master clock
- Calculate normalized loop position: `t = (clock.elapsedTime % 12) / 12`
- Each phase has its own normalized sub-range, e.g. Protocols ignite phase: `tProtocols = clamp((t - 0.125) / 0.083, 0, 1)`
- Use `lerp` to interpolate emissive intensity, color, and other animated values between off and on states
- Use `easeInOutCubic` easing for the ignite transitions (not linear — too mechanical)
- Use `easeOutQuad` for the fade-back at the end (faster initial decay)

---

## Lighting

Minimal, deliberate. Don't overload the scene.

### Three lights total:

**1. Key light** (cream, upper-front-left)
- `DirectionalLight`
- Position: `[-3, 4, 3]`
- Color: `#F4F0E8` (cream-100)
- Intensity: 0.7
- Casts soft shadows on the pedestals

**2. Rim light** (brand-blue, lower-back-right)
- `DirectionalLight`
- Position: `[3, -1, -3]`
- Color: `#A8C8E8` (brand-300)
- Intensity: 0.5
- Creates signature edge glow on objects

**3. Center accent light** (champagne, animated)
- `PointLight`
- Position: `[0, 0.4, 0]` (above ground plane, center of the loop)
- Color: `#E8DCC4` (champagne-200)
- Intensity: animates 0 → 0.6 during the FULL SYSTEM ALIVE phase (9.5–11.0s), 0 otherwise
- Distance: 3
- Decay: 2

### Environment

```tsx
<Environment preset="warehouse" background={false} />
```

Provides ambient image-based lighting that catches in clearcoat materials. `background={false}` keeps canvas transparent.

---

## Technical Implementation

### File Structure

Replace `/components/marketing/hero-3d/` contents:

```
/components/marketing/hero-3d/
├── ConvergenceHero.tsx              (existing wrapper, keep)
├── ConvergenceHeroLoader.tsx        (existing client wrapper, keep)
├── Scene.tsx                        (rewrite)
├── pillars/
│   ├── ProtocolsPillar.tsx          (NEW — replaces ProtocolsSegment)
│   ├── DeliveryPillar.tsx           (NEW — replaces DeviceSegment)
│   ├── DataPillar.tsx               (NEW — replaces DataSegment)
│   └── BiologicPillar.tsx           (NEW — replaces BiologicSegment)
├── components/
│   ├── Pedestal.tsx                 (NEW — shared pedestal component)
│   └── FlowArrow.tsx                (NEW — connecting arrow with tube + cone)
├── lighting.tsx                     (rewrite — 3 lights)
├── materials.ts                     (rewrite — new material configs per pillar)
├── motion.ts                        (rewrite — phase-based activation timing)
├── constants.ts                     (rewrite — new positions, colors, timings)
└── StaticFallback.tsx               (rewrite — match new composition)
```

### Bundle Strategy

Three.js + R3F + drei stays in a separate chunk. Lazy load via dynamic import (existing setup from Pass 1 still works).

Add: `@react-three/postprocessing` for subtle bloom on emissive elements (the glow on screen, particles, arrow pulses). Keep bloom intensity LOW — too much and it goes corny.

### Performance

- Mobile (<768px): static fallback, no 3D
- Tablet (768–1024px): full 3D, but reduce particle count in Data pillar from 100 to 50, reduce torus segments
- Desktop (1024px+): full quality

### Reduced Motion

Static fallback shows the FULL SYSTEM ALIVE state — all pillars glowing, all arrows lit, peak frame. Frozen, no animation, but identical visual quality to the peak moment.

### Static Fallback (SVG)

Rewrite `StaticFallback.tsx` to be a clean SVG rendering of the four-pedestal arrangement with arrows connecting them in a loop. Use the same brand colors. Should look beautiful even without 3D — never embarrassing if 3D fails.

---

## Material References (do not deviate)

```ts
// constants.ts

export const COLORS = {
  midnight800: "#0C1426",
  midnight700: "#121C33",
  ink700:      "#1F2A3D",
  brand300:    "#A8C8E8",
  brand400:    "#7FAEDB",
  brand500:    "#5891CA",
  champagne200:"#E8DCC4",
  cream100:    "#F4F0E8",
  cream50:     "#FDFCF9",
};

export const PEDESTAL_POSITIONS = {
  protocols: [-1.4, 0, -0.8],
  delivery:  [ 1.4, 0, -0.8],
  data:      [ 1.4, 0,  0.8],
  biologic:  [-1.4, 0,  0.8],
};

export const LOOP_DURATION = 12; // seconds

export const PHASES = {
  ambient:        { start: 0.0,  end: 1.5  },
  protocolsOn:    { start: 1.5,  end: 2.5  },
  arrowProtoDel:  { start: 2.5,  end: 3.5  },
  deliveryOn:     { start: 3.5,  end: 4.5  },
  arrowDelData:   { start: 4.5,  end: 5.5  },
  dataOn:         { start: 5.5,  end: 6.5  },
  arrowDataBio:   { start: 6.5,  end: 7.5  },
  biologicOn:     { start: 7.5,  end: 8.5  },
  arrowBioProto:  { start: 8.5,  end: 9.5  },
  fullAlive:      { start: 9.5,  end: 11.0 },
  fadeOut:        { start: 11.0, end: 12.0 },
};
```

---

## Verification

Before declaring done:

1. `npm run build` clean — Three.js bundle separate from main
2. `npm run dev` — visit homepage, scene renders correctly
3. Visual review at 12-sec loop:
   - All four pedestals visible with their pillar objects
   - Each pillar reads as its meaningful object (NOT generic primitives)
   - Activation sequence runs cleanly through all 11 phases
   - FULL SYSTEM ALIVE moment visibly different from idle
   - Champagne accent light fires only during fullAlive phase
4. Responsive:
   - Mobile (375px): static fallback only
   - Tablet (768px): 3D, reduced particles
   - Desktop (1280px): full quality
5. `prefers-reduced-motion`: collapses to FULL SYSTEM ALIVE static frame
6. No console errors or warnings
7. Bundle size: report the size of the 3D chunk separately

### Send screenshots:

- Idle / ambient state (T=0.5s)
- Protocols ignited (T=2s)
- Mid-flow during arrow pulse (T=3s)
- Data pillar active with particles flowing (T=6s)
- FULL SYSTEM ALIVE (T=10s) — this is the hero shot
- Static fallback render

---

## Pre-Delivery Checklist (from MASTER.md)

- [ ] All colors from MASTER.md tokens, no arbitrary hex
- [ ] No fonts, no icon library changes
- [ ] TypeScript strict, no `any`
- [ ] Responsive at 375 / 768 / 1024 / 1440
- [ ] `prefers-reduced-motion` respected (static fallback)
- [ ] Off-screen pause active (existing IntersectionObserver from Pass 1)
- [ ] No console errors or warnings
- [ ] aria-label on canvas: "A visualization of the four-pillar Precise System: Protocols, Delivery Mechanism, Data Intelligence, and Biologic Control, connected in a closed loop"
- [ ] Lazy-loaded (not in main bundle)

---

## What This Replaces

This Pass 3 replaces ALL of Pass 1 and Pass 2 visual output. The orbiting four-shape concept is abandoned. The new concept is system flow visualization.

What's preserved from prior passes:
- Canvas mounting and lazy load infrastructure
- Mouse parallax on camera (5°/3°)
- IntersectionObserver pause
- Mobile/tablet/desktop tier system
- File location structure (under `/components/marketing/hero-3d/`)

What's replaced:
- All geometries
- All materials
- All motion choreography
- Lighting setup
- Scene composition
- Static fallback design

---

## Iteration Plan

This is the centerpiece visual asset of the brand. Plan for multiple passes.

**Pass 3 (this session):** Get the structure and choreography right.
- All four pillars rendering as their meaningful objects
- Activation sequence playing through all phases
- Materials roughly right (not generic-looking)
- Lighting roughly right

**Pass 4 (next session):** Refine the look.
- Material polish (clearcoat, glass refraction, glow intensity)
- Lighting balance
- Particle stream timing in Data
- Arrow pulse shader refinement
- Bloom tuning

**Pass 5 (final pass):** Polish.
- Mobile fallback refinement
- Performance tuning
- Final color/timing adjustments

---

## Do NOT in This Session

- Do not use generic primitives where meaningful objects are specified
- Do not add personalities, names, or labels to the scene
- Do not animate beyond the spec'd phases
- Do not add sound (this is web; sound at the launch event is a separate consideration)
- Do not change fonts, colors, icons outside the system tokens
- Do not show any device branding ("Precise Pico" text, P|A monogram on objects, etc.)

---

## Deliverables

When done, report back:
1. Working preview URL
2. The six screenshot moments listed above
3. Bundle size impact (3D chunk size)
4. Any decisions made not explicit in this prompt
5. Any blockers or questions

Then we look at it together and decide what to refine in Pass 4.
