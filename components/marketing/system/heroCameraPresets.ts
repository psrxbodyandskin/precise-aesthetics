import type { PillarKey } from "@/components/marketing/sections/SinglePillarScene";

// Per-pillar camera configurations for the system pillar page heroes.
// Each pillar gets a unique camera angle that emphasizes its character —
// four different art-directed compositions, not four versions of the same shot.
//
// position: [x, y, z] — camera location in world space
// target:   [x, y, z] — point the camera looks at (camera.lookAt())
// fov:      vertical field of view in degrees
//
// Coordinate refresher: +Y is up. +Z is "out of the screen" (toward viewer).
// The pillars all sit centered at world origin (0, 0, 0) thanks to the
// per-pillar offset wrappers in SinglePillarScene.
export const HERO_CAMERA_PRESETS: Record<
  PillarKey,
  {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  }
> = {
  // Protocols — close, oblique side-angle on the stacked curved panels.
  // Camera pulled to upper-right, slightly elevated, looking down-into the
  // stack. The layered "manuscript" character reads.
  protocols: {
    position: [1.7, 0.5, 1.6],
    target: [0, 0, 0],
    fov: 38,
  },
  // Delivery — straight-on, eye-level with the sphere. Product-portrait.
  // PA monogram inside reads centered. Slight telephoto FOV (lower number)
  // for less perspective distortion, more "studio shot" feel.
  delivery: {
    position: [0, 0, 2.1],
    target: [0, 0, 0],
    fov: 34,
  },
  // Biologic — low angle looking slightly up at the bottle cluster.
  // Bottles read taller, more dignified. Champagne caps catch upper light.
  // Wider FOV to fit the cluster from below without losing the caps.
  biologic: {
    position: [0, -0.4, 2.5],
    target: [0, 0.25, 0],
    fov: 42,
  },
  // Data Intelligence — bird's-eye looking down at the torus. The ring
  // becomes a flat orbital with particles streaming around it.
  // Distinctly different read from the homepage's three-quarter-side angle.
  data: {
    position: [0, 2.4, 0.6],
    target: [0, 0, 0],
    fov: 40,
  },
};
