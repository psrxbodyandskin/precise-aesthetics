# Session 4.5 — "Convergence" Three.js Hero

> Standalone session. Run after Session 4 is shipped. Builds the 3D hero asset that the full homepage (Session 5) will be designed around.

## Context

You have already read `CLAUDE.md`, `design-system/MASTER.md`, `design-system/BRAND-IDENTITY.md`, and `design-system/COPY-DECK.md`.

This session builds **the centerpiece visual asset of the entire site** — a Three.js 3D scene representing the four-pillar Precise System. It lives in the homepage hero's right column, bleeds to the viewport edge, and runs a continuous breathing loop with subtle mouse parallax.

This asset is the most ambitious creative work in the project. It will be the thing people remember from the site. Treat it accordingly.

---

## The Concept: "Convergence"

Four geometric forms, each carrying a distinct visual identity, orbit a shared center. They drift apart, pause in their separated positions, then converge back into a unified form. Twelve-second breathing loop. Subtle, hypnotic, calm.

When assembled, the four pieces fit together into a roughly spherical unified form with visible seams — honored joints, not hidden ones. The seams say "this is one thing made of four parts."

The four shapes:

| Pillar | Shape | Material feel | Reads as |
| --- | --- | --- | --- |
| Device | Faceted icosahedron, sliced cleanly — top hemisphere | Polished ceramic, low roughness, high clearcoat | Engineering, precision |
| Protocols | Stepped form — three rounded plates stacked with slight rotation between each | Same ceramic finish, slightly warmer | Layered system, rules |
| Biologic Control | Soft torus segment, ring-shaped, organic curve | Same ceramic with champagne tint | Healing, biology |
| Data | Clustered group of small geometric particles held in formation by an invisible field | Same ceramic, slightly cooler | Information, intelligence |

When separated, each segment moves to its orbital position around the shared center.
When assembled, they lock together in a unified spherical form.

---

## Locked Decisions (do not deviate without flagging)

- **Position:** Right column on desktop (≥1024px). Above the headline on mobile (<1024px).
- **Framing:** Bleeds to the right edge of the viewport. No container border. No card. No drop shadow.
- **Loop:** Continuous 12-second breathing cycle.
- **Interaction:** 5° camera parallax on mouse position. No scroll response. No click handlers.
- **Reduced motion:** All animation collapses to a static rendered frame at the assembled state.
- **Background:** Inherits the hero section's `midnight-deep` (`#0C1426`). Canvas is transparent so the section background shows through.

---

## Tech Stack

- `three` — core 3D library
- `@react-three/fiber` — React renderer for Three.js
- `@react-three/drei` — common helpers (camera, environment, materials)
- `@react-spring/three` — physics-based easing for the breathing loop
- `react-intersection-observer` — pause animation when off-screen for perf
- TypeScript strict throughout

Install with: `npm install three @react-three/fiber @react-three/drei @react-spring/three react-intersection-observer && npm install -D @types/three`

---

## File Structure

```
/components/marketing/hero-3d/
├── ConvergenceHero.tsx         # Main exported component (client)
├── Scene.tsx                   # Three.js scene composition
├── DeviceSegment.tsx           # Top: icosahedron hemisphere
├── ProtocolsSegment.tsx        # Right: stepped form
├── BiologicSegment.tsx         # Bottom: torus segment
├── DataSegment.tsx             # Left: particle cluster
├── lighting.ts                 # Light setup (3 lights)
├── materials.ts                # Shared MeshPhysicalMaterial config
├── motion.ts                   # Breathing curve helpers
├── constants.ts                # Brand colors, timing values
└── StaticFallback.tsx          # SSR / reduced-motion fallback (CSS-only)
```

---

## Part 1 — Scene Composition

### Camera

`PerspectiveCamera`, FOV 35° (gives a slightly compressed, premium feel).
Position: `[0, 0, 6]`. Looking at origin `[0, 0, 0]`.

The camera has a parallax offset driven by mouse position:
- Track mouse over the hero section only (not the whole window)
- Smoothly interpolate camera offset toward target on each frame: `lerp(current, target, 0.05)`
- Max offset: ±5° rotation around the Y axis, ±3° around X axis
- Reset to neutral when mouse leaves the hero

### Center Point

The four segments orbit around `(0, 0, 0)`. Render a tiny `<Sphere>` at the center, radius 0.04, brand-blue color (`brand-300`), opacity that breathes (0.4 → 0.9 → 0.4 over 12s) — this is the "core" that holds the system together visually.

### Coordinate System

| Pillar | Resting position (assembled) | Apart position |
| --- | --- | --- |
| Device | `[0, 0.6, 0]` | `[0, 1.6, 0]` |
| Protocols | `[0.6, 0, 0]` | `[1.6, 0, 0]` |
| Biologic | `[0, -0.6, 0]` | `[0, -1.6, 0]` |
| Data | `[-0.6, 0, 0]` | `[-1.6, 0, 0]` |

Each segment also rotates slightly differently as it travels (subtle, ~15° on its own axis). Different easing per segment so they don't move in lockstep.

The whole assembled-segment-cluster also rotates around its center on a slow Y-axis — 60-second full rotation. Adds depth.

---

## Part 2 — The Four Segments

### 2.1 DeviceSegment.tsx — Top (Faceted Icosahedron Hemisphere)

```
Geometry: IcosahedronGeometry(0.55, 1)
Modification: clip the bottom half via clippingPlanes or by using a custom shader
Material: see materials.ts — brand-blue tint
Position: derives from breathing curve (assembled vs apart)
Rotation: slight axial spin (~0.001 rad/frame on Y)
```

Faceted, crystalline. Low-poly intentional — facets catch light differently as it rotates.

### 2.2 ProtocolsSegment.tsx — Right (Stepped Form)

```
Geometry: three RoundedBox shapes from drei, stacked on Z-axis with offsets:
  - Plate 1: width 0.8, height 0.18, depth 0.08, radius 0.04, position [0, 0, -0.16]
  - Plate 2: width 0.7, height 0.18, depth 0.08, radius 0.04, position [0, 0, 0], rotation [0, 0, 0.05]
  - Plate 3: width 0.6, height 0.18, depth 0.08, radius 0.04, position [0, 0, 0.16], rotation [0, 0, -0.05]
Group rotation: slight axial spin
Material: brand-blue tint, slightly warmer
```

Layered, structured, like a stack of clinical documents.

### 2.3 BiologicSegment.tsx — Bottom (Torus Segment)

```
Geometry: TorusGeometry(0.45, 0.12, 16, 64, Math.PI * 1.2) — 60% of a full ring
Rotation: torus oriented so the opening faces forward
Material: champagne tint — this is the only segment that uses champagne
Group rotation: slight axial spin
```

Curved, organic, soft. The champagne tint is the brand's wax seal — only this segment carries it.

### 2.4 DataSegment.tsx — Left (Particle Cluster)

```
Group of 12 small geometric primitives (mix of small cubes 0.06 and small octahedrons 0.05):
- Distributed within a 0.5-radius spherical volume around the segment's anchor point
- Each particle has a slight random offset that drifts subtly on its own (NOT in sync)
- Material: brand-blue tint, slightly cooler

Implementation: useMemo a stable seed for particle positions so SSR + hydration match.
Use InstancedMesh for the 12 instances (perf optimization, even though count is low).
```

When the cluster is in the "apart" position, particles drift slightly outward. When converging, they tighten.

---

## Part 3 — Materials (`materials.ts`)

Shared base material config:

```ts
import { MeshPhysicalMaterial } from "three";

export const BRAND_COLORS = {
  device: "#A8C8E8",      // brand-300
  protocols: "#7FAEDB",   // brand-400 (slightly warmer)
  biologic: "#E8DCC4",    // champagne-200
  data: "#5891CA",        // brand-500 (cooler)
};

export const baseMaterialConfig = {
  roughness: 0.18,
  metalness: 0.05,
  clearcoat: 1.0,
  clearcoatRoughness: 0.08,
  reflectivity: 0.4,
  envMapIntensity: 0.6,
};
```

Each segment instantiates `MeshPhysicalMaterial` with its color from `BRAND_COLORS` and the shared config.

The material reads:
- Polished but not metallic
- Reflective enough to catch the rim light
- Soft enough to feel ceramic, not chrome

Reference: think Aesop bottles or polished river stones, not iPhone backs.

---

## Part 4 — Lighting (`lighting.ts`)

Three lights. No more.

### Light 1: Key Light (upper-left)

```ts
<directionalLight
  position={[-3, 4, 3]}
  intensity={0.9}
  color="#F4F0E8"          // cream-100
/>
```

Soft, cream-toned, simulates indirect window light from upper-left. Casts soft shadows.

### Light 2: Rim Light (lower-right)

```ts
<directionalLight
  position={[3, -2, -2]}
  intensity={0.5}
  color="#A8C8E8"          // brand-300
/>
```

Cool blue rim from below-right, creates the signature edge glow on segments.

### Light 3: Champagne Accent (under-center, animated)

```ts
<pointLight
  position={[0, -0.5, 1]}
  intensity={animatedIntensity}  // 0 → 0.6 → 0 during assembly moment
  color="#E8DCC4"          // champagne-200
  distance={3}
  decay={2}
/>
```

This light **only fires during the assembly moment** of the loop (3-5s mark). It rims the converging segments with a subtle gold glow that reads as "this is the moment."

### Environment

```ts
<Environment preset="studio" background={false} />
```

Provides ambient image-based lighting that catches in the polished material clearcoat. `background={false}` keeps the canvas transparent.

---

## Part 5 — Motion Choreography (`motion.ts`)

12-second breathing cycle:

```
0:00 – 3:00   Form assembled, slow Y-axis rotation
3:00 – 5:00   Champagne light fades up, holds 1s, fades down
              (the "assembly moment")
5:00 – 8:00   Segments drift outward, slight rotation per segment
8:00 – 10:00  Segments hover at apart positions, drifting subtly
10:00 – 12:00 Segments converge back with gentle overshoot,
              settling into seam-matched assembly
```

### Implementation

Use `useSpring` from `@react-spring/three` per segment. Each segment has a `progress` value that drives both position and rotation.

Master clock from `useFrame((state) => { ... })` — calculate normalized cycle position (0–1) from `state.clock.getElapsedTime() % 12 / 12`.

Map cycle position to per-segment progress with offset and easing:
- Each segment uses `easeInOutCubic` for the position curve
- Add micro-overshoot at the end of convergence: target position * 1.04 → settles at target (gives the "click" feel)
- Each segment has a slight phase offset (50ms apart) so they don't move in unison

### Reduced Motion

```tsx
const prefersReducedMotion = useReducedMotion();

if (prefersReducedMotion) {
  return <StaticAssembledFrame />;
}
```

`StaticAssembledFrame` renders the same scene with all segments at their assembled positions, lights set to the assembled-state, no animation. Same camera, same materials, same composition — just frozen at the most beautiful frame.

### Off-screen Pause

Use `react-intersection-observer` to detect when the hero canvas is off-screen. When off-screen:
- Pause the `useFrame` loop
- Stop spring animations
- Resume when re-entering viewport

This is critical for perf — a 3D scene running while the user is reading the rest of the page wastes battery.

---

## Part 6 — Mouse Parallax

In `Scene.tsx`, track mouse position relative to the hero section:

```tsx
const mouseRef = useRef({ x: 0, y: 0 });
const targetRef = useRef({ x: 0, y: 0 });

// On mousemove within hero section:
// Normalize mouse position to -1..1 range
// Apply to targetRef

useFrame(({ camera }) => {
  // Smoothly lerp camera rotation toward target
  mouseRef.current.x = lerp(mouseRef.current.x, targetRef.current.x, 0.05);
  mouseRef.current.y = lerp(mouseRef.current.y, targetRef.current.y, 0.05);

  // Apply 5° max rotation on Y, 3° on X
  camera.rotation.y = mouseRef.current.x * (Math.PI / 36); // ~5°
  camera.rotation.x = -mouseRef.current.y * (Math.PI / 60); // ~3°
});
```

When mouse leaves the hero, `targetRef` resets to `{ x: 0, y: 0 }` and the camera smoothly returns to neutral.

On touch devices: skip the parallax entirely. Detect via `pointer: coarse` media query.

---

## Part 7 — Performance & Mobile Strategy

### Lazy Loading

`ConvergenceHero` is dynamically imported in the homepage:

```tsx
const ConvergenceHero = dynamic(
  () => import("@/components/marketing/hero-3d/ConvergenceHero"),
  {
    ssr: false,
    loading: () => <StaticFallback />,
  }
);
```

This keeps the main bundle small. Three.js + R3F adds ~600KB; we don't ship it on initial page load — it loads after the page paints.

### SSR Fallback (`StaticFallback.tsx`)

Pure CSS/SVG component that renders during the dynamic import and on mobile devices below a perf threshold. Should look like a frozen, beautiful frame of the assembled state — gradient, soft shadow, hint of the geometry. Not a placeholder; a stand-in that's never embarrassing if 3D fails to load.

Use the SVG concept I generated previously as a starting reference. Static, midnight bg, suggestive of the assembled form.

### Mobile

On screens below 768px:
- Render `StaticFallback` instead of the 3D scene
- Reasons: small screen makes detail invisible; perf cost not worth it; thumb-driven UX doesn't benefit from parallax
- Detect via media query, not user-agent

On screens 768-1024px (tablets):
- Render the 3D scene but reduce particle count in DataSegment from 12 to 6
- Disable mouse parallax (touch device)

On screens 1024px+:
- Full quality, full feature set

### Quality Settings

In `<Canvas>`, set:

```tsx
<Canvas
  dpr={[1, 2]}                    // cap DPR at 2 (retina)
  gl={{
    antialias: true,
    alpha: true,                   // transparent canvas
    preserveDrawingBuffer: false,  // perf
    powerPreference: "high-performance",
  }}
  performance={{ min: 0.5 }}       // throttle if FPS drops
  frameloop="demand"               // only render when needed
>
```

Note: `frameloop="demand"` requires manual invalidation on each animation tick. Use `useFrame`'s built-in mechanism for this.

---

## Part 8 — Layout Integration

### Desktop Hero (≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]                                  [Nav]      [CTA]   │
│                                                              │
│                                                              │
│   Eyebrow                            ╔════════════════════╗ │
│                                      ║                    ║ │
│   Predictable                        ║                    ║ │
│   outcomes across                    ║   3D SCENE         ║ │
│   every skin type.                   ║   (bleeds          ║ │
│                                      ║    to edge)        ║ │
│   Lead paragraph here                ║                    ║ │
│   describing the system.             ║                    ║ │
│                                      ║                    ║ │
│   [Primary CTA] [Secondary]          ║                    ║ │
│                                      ╚════════════════════╝ │
└─────────────────────────────────────────────────────────────┘
```

Hero section uses CSS Grid: `grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`.

The 3D canvas container has:
- `position: absolute` from `right: 0` extending the canvas to viewport edge
- `width: clamp(500px, 50vw, 800px)`
- `height: 100%` of hero section
- `overflow: visible` so the 3D form can render slightly outside its bounds

### Mobile Hero (<1024px)

```
┌──────────────────────┐
│  [Logo]   [Menu]     │
│                      │
│  ╔════════════════╗  │
│  ║                ║  │
│  ║  Static SVG    ║  │
│  ║  (or 3D below  ║  │
│  ║   threshold)   ║  │
│  ║                ║  │
│  ╚════════════════╝  │
│                      │
│  Eyebrow             │
│  Predictable         │
│  outcomes across     │
│  every skin type.    │
│  Lead text...        │
│  [CTAs]              │
└──────────────────────┘
```

3D scene (or static fallback) sits above the headline on mobile. Centered, bleeds to both edges.

---

## Part 9 — Hero Component Update

Update `app/(marketing)/page.tsx` hero section to integrate the new component:

```tsx
import dynamic from "next/dynamic";

const ConvergenceHero = dynamic(
  () => import("@/components/marketing/hero-3d/ConvergenceHero"),
  { ssr: false, loading: () => <StaticFallback /> }
);

// In hero section:
<Section tone="midnight-deep" size="hero" className="relative overflow-hidden">
  <Container>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Left: text */}
      <div>
        <Eyebrow>...</Eyebrow>
        <DisplayHeading level="xl">...</DisplayHeading>
        <Lead>...</Lead>
        <div className="flex gap-4">...</div>
      </div>

      {/* Right: 3D (desktop) or static fallback (mobile) */}
      <div className="hidden lg:block">
        {/* Empty placeholder — 3D is absolutely positioned */}
      </div>
    </div>
  </Container>

  {/* Absolutely positioned 3D canvas, bleeds right */}
  <div className="absolute right-0 top-0 h-full w-1/2 hidden lg:block pointer-events-none">
    <ConvergenceHero />
  </div>

  {/* Mobile: above headline */}
  <div className="lg:hidden mb-12">
    <ConvergenceHero />
  </div>
</Section>
```

Note: `pointer-events-none` on the 3D wrapper so mouse parallax detection runs but the canvas doesn't intercept clicks meant for the form CTAs. The mouse position itself is tracked separately.

Wait — that conflicts with mouse parallax. Resolve: track mouse on the *Section* element, not the canvas. Canvas stays `pointer-events: none`, mouse tracking is a Section-level effect.

---

## Part 10 — Verification

Before declaring done:

1. `npm run build` clean — Three.js and R3F bundled into a separate chunk, not the main bundle
2. `npm run dev` — visit homepage, scene renders correctly
3. Visual review checkpoints:
   - Four distinct segments visible
   - 12-second loop runs smoothly at 60fps
   - Champagne accent light fires only at the assembly moment
   - Mouse parallax responds within hero section, resets when leaving
   - Each segment's geometry is clearly distinguishable (icosahedron, stepped, torus, particles)
4. Performance:
   - Lighthouse on the production build — Performance ≥ 85 (3D scenes have inherent cost; 95 may not be possible)
   - Manual FPS check via DevTools Performance tab: should hold 60fps on a mid-range laptop
   - Mobile (375px): static fallback renders, no 3D loaded
   - Tablet (768px): 3D loaded, particles reduced to 6
5. Accessibility:
   - `prefers-reduced-motion` collapses to static frame
   - Canvas has `aria-label="A geometric representation of the four-pillar Precise System"`
   - No focus traps; canvas is decorative, not interactive
6. Reduced motion test: toggle in DevTools Rendering tab, reload, confirm no animation runs
7. Off-screen pause: scroll down, open DevTools Performance, confirm canvas stops rendering

---

## Iteration Plan

This is the most ambitious creative work in the project. Don't expect perfection in the first pass.

**Pass 1 (this session):** Get the structure right.
- All four segments rendering at correct positions
- Loop timing correct
- Lighting roughly right
- Materials roughly right
- Mouse parallax working

**Pass 2 (next session):** Refine the look.
- Material refinement (roughness, clearcoat, reflectivity)
- Lighting balance (intensity, color, position)
- Motion easing (overshoot, phase offsets)
- Particle distribution in DataSegment

**Pass 3 (final pass):** Polish.
- Subtle ambient fog if needed
- DOF blur on outer edges
- Final perf tuning
- Mobile fallback refinement

Plan accordingly. After Pass 1 we look together and decide what needs adjustment.

---

## Pre-Delivery Checklist (from MASTER.md)

- [ ] Reads from MASTER.md tokens only — colors map to brand tokens, no arbitrary hex
- [ ] TypeScript strict, no `any`
- [ ] Responsive: 375 / 768 / 1024 / 1440
- [ ] `prefers-reduced-motion` respected (static fallback)
- [ ] No console errors or warnings
- [ ] Lazy-loaded (not in main bundle)
- [ ] Off-screen pause active
- [ ] aria-label on canvas
- [ ] No font changes
- [ ] No icon library changes

---

## Do NOT in This Session

- Do not build the full homepage (Session 5)
- Do not add additional 3D scenes elsewhere on the site
- Do not introduce new fonts, icons, or design tokens
- Do not change MASTER.md tokens or globals.css
- Do not commission external 3D assets (this is built in Three.js)
- Do not add audio, particles beyond the DataSegment, or decorative effects beyond the spec
- Do not animate on scroll (was excluded by design decision)

---

## Deliverables

When done, report back:
1. Working preview URL (deployed or local)
2. Screen recording or screenshots of the loop at key moments (assembled, separating, apart, converging)
3. Mouse parallax demonstration
4. Reduced-motion fallback verification
5. Build size impact (how much did the 3D chunk add)
6. Any decisions made not explicit in this prompt
7. Any blockers or questions

Then we look at it together and decide what to refine in Pass 2.
