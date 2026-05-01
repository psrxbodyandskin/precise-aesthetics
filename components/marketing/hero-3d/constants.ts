// Pass 3 — System Activation Flow.
// All hex values map to MASTER.md tokens. No off-system colors.

export const COLORS = {
  midnight800: "#0C1426", // surface-midnight-deep, monolith body
  midnight700: "#121C33", // deeper card
  ink700: "#1F2A3D", // pedestal disc, idle arrow tubes
  brand300: "#A8C8E8", // brand accent — circuit base, key emissive
  brand400: "#7FAEDB",
  brand500: "#5891CA", // data torus base
  champagne200: "#E8DCC4", // sanctioned: caps + arrow-arrival blink + fullAlive accent
  cream100: "#F4F0E8", // ceramic bottle body, key light color
  cream50: "#FDFCF9",
} as const;

// Top-down ground-plane positions for the four pedestals (y=0).
// Camera is elevated and pulled back; clockwise loop reads as a wheel.
// Pass 4: tightened X from ±1.4 to ±1.1; swapped Biologic↔Data so flow reads
// as device→biologic kits→data captured→data refines protocols.
export const PEDESTAL_POSITIONS = {
  protocols: [-1.5, 0, -1.05],
  delivery: [1.5, 0, -1.05],
  biologic: [1.5, 0, 1.05],
  data: [-1.5, 0, 1.05],
} as const;

export type PillarKey = keyof typeof PEDESTAL_POSITIONS;

// Clockwise flow order: protocols → delivery → biologic → data → protocols.
export const PILLAR_ORDER: readonly PillarKey[] = [
  "protocols",
  "delivery",
  "biologic",
  "data",
];

// Pedestal disc geometry.
export const PEDESTAL_RADIUS = 0.55;
export const PEDESTAL_HEIGHT = 0.08;

// Activation cycle.
export const LOOP_DURATION = 12; // seconds

// Phase boundaries (seconds within the 12s loop). 11 phases per spec §"The Activation Sequence".
// Pass 4 flow: protocols → delivery → biologic → data → protocols.
export const PHASES = {
  ambient: { start: 0.0, end: 1.5 },
  protocolsOn: { start: 1.5, end: 2.5 },
  arrowProtoDel: { start: 2.5, end: 3.5 },
  deliveryOn: { start: 3.5, end: 4.5 },
  arrowDelBio: { start: 4.5, end: 5.5 },
  biologicOn: { start: 5.5, end: 6.5 },
  arrowBioData: { start: 6.5, end: 7.5 },
  dataOn: { start: 7.5, end: 8.5 },
  arrowDataProto: { start: 8.5, end: 9.5 },
  fullAlive: { start: 9.5, end: 11.0 },
  fadeOut: { start: 11.0, end: 12.0 },
} as const;

export type PhaseKey = keyof typeof PHASES;

// Per-pillar idle Y-rotation periods (seconds for one full revolution).
export const IDLE_ROTATION_SECONDS = {
  protocols: 30,
  delivery: 60,
  data: 20,
  biologic: 40,
} as const;

// Camera config — Pass 5b: more tilt for clearer top-down read of the loop.
export const CAMERA_POSITION: [number, number, number] = [0, 3.2, 6.5];
export const CAMERA_TARGET: [number, number, number] = [0, 0, 0];
export const CAMERA_FOV = 42;

// Continuous Y-axis spin for the whole loop arrangement (seconds per revolution).
export const SCENE_SPIN_SECONDS = 48;

// Mouse parallax (preserved from Pass 1).
export const PARALLAX_MAX_X_DEG = 5;
export const PARALLAX_MAX_Y_DEG = 3;
export const PARALLAX_LERP = 0.08;

// Tier breakpoints.
export const BREAKPOINT_TABLET_PX = 768;
export const BREAKPOINT_DESKTOP_PX = 1024;
export type Tier = "static" | "tablet" | "desktop";

// Data pillar tuning per tier — Pass 5: bumped desktop torus tubular for smooth highlights.
export const DATA_PARTICLE_COUNT_DESKTOP = 100;
export const DATA_PARTICLE_COUNT_TABLET = 50;
export const DATA_TORUS_TUBULAR_DESKTOP = 256;
export const DATA_TORUS_TUBULAR_TABLET = 64;
export const DATA_TORUS_RADIAL_DESKTOP = 32;
export const DATA_TORUS_RADIAL_TABLET = 16;

// Idle vs ignited emissive intensities — Pass 5b: pulled back from the earlier
// HDR overshoot. Refs are quieter; tone mapping still compresses enough at these
// values without the scene feeling neon-lit.
export const EMISSIVE_AMBIENT = 0.1;
export const EMISSIVE_IGNITED = 0.95;
export const EMISSIVE_DELIVERY_SCREEN_IDLE = 0.4;
export const EMISSIVE_DELIVERY_SCREEN_IGNITED = 1.3;
