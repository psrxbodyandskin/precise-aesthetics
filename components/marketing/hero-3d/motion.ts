import { useEffect, useRef, useState } from "react";
import {
  LOOP_DURATION,
  PARALLAX_LERP,
  PARALLAX_MAX_X_DEG,
  PARALLAX_MAX_Y_DEG,
  PHASES,
  type PhaseKey,
} from "./constants";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

// Easings. Pass 4 swap: ignite transitions use the canonical MASTER §11.2
// CSS cubic-bezier(0.65, 0, 0.35, 1). Solve via Newton-Raphson on x to find
// the parameter s, then evaluate y(s) on the bezier.
function bezierAxis(s: number, p1: number, p2: number): number {
  const u = 1 - s;
  return 3 * u * u * s * p1 + 3 * u * s * s * p2 + s * s * s;
}
function bezierAxisDeriv(s: number, p1: number, p2: number): number {
  const u = 1 - s;
  return 3 * u * u * p1 + 6 * u * s * (p2 - p1) + 3 * s * s * (1 - p2);
}

export function cssEaseInOut(t: number): number {
  // cubic-bezier(0.65, 0, 0.35, 1)
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const p1x = 0.65;
  const p1y = 0;
  const p2x = 0.35;
  const p2y = 1;
  let s = t;
  for (let i = 0; i < 8; i++) {
    const x = bezierAxis(s, p1x, p2x);
    const dx = bezierAxisDeriv(s, p1x, p2x);
    if (Math.abs(dx) < 1e-6) break;
    const next = s - (x - t) / dx;
    if (Math.abs(next - s) < 1e-5) {
      s = next;
      break;
    }
    s = next;
  }
  // Clamp s to [0, 1] in case Newton overshoots.
  if (s < 0) s = 0;
  if (s > 1) s = 1;
  return bezierAxis(s, p1y, p2y);
}

// Kept for the fade-out tail (faster initial decay reads better than the symmetric S).
export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

// Backwards-compat alias — anything still calling easeInOutCubic gets the new bezier.
export const easeInOutCubic = cssEaseInOut;
function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// Loop time in SECONDS within the 12s cycle.
export function loopSeconds(elapsedSeconds: number): number {
  return ((elapsedSeconds % LOOP_DURATION) + LOOP_DURATION) % LOOP_DURATION;
}

// Normalized 0..1 progress within a named phase. Returns 0 before phase, 1 after.
export function phaseProgress(loopSec: number, phase: PhaseKey): number {
  const { start, end } = PHASES[phase];
  if (loopSec < start) return 0;
  if (loopSec >= end) return 1;
  return (loopSec - start) / (end - start);
}

// True while we're inside the named phase.
export function inPhase(loopSec: number, phase: PhaseKey): boolean {
  const { start, end } = PHASES[phase];
  return loopSec >= start && loopSec < end;
}

// Pillar emissive intensity 0..1 over its full lifecycle:
// dim ambient → ignite (eased) → hold lit → fade out.
// `igniteKey` is the per-pillar ignite phase (e.g. "protocolsOn").
export function pillarLitMix(
  loopSec: number,
  igniteKey: PhaseKey,
): number {
  const ignite = phaseProgress(loopSec, igniteKey);
  const fade = phaseProgress(loopSec, "fadeOut");
  if (loopSec < PHASES[igniteKey].start) return 0;
  if (loopSec < PHASES[igniteKey].end) return easeInOutCubic(ignite);
  if (loopSec < PHASES.fadeOut.start) return 1;
  return 1 - easeOutQuad(fade);
}

// Arrow lit mix — the arrow is dim until its own ignite phase, fully lit after,
// then fades during fadeOut.
export function arrowLitMix(
  loopSec: number,
  igniteKey: PhaseKey,
): number {
  if (loopSec < PHASES[igniteKey].start) return 0;
  if (loopSec < PHASES[igniteKey].end) {
    return easeInOutCubic(phaseProgress(loopSec, igniteKey));
  }
  if (loopSec < PHASES.fadeOut.start) return 1;
  return 1 - easeOutQuad(phaseProgress(loopSec, "fadeOut"));
}

// Pulse position 0..1 along an arrow's tube during its ignite phase.
// Returns null when not active (no pulse to draw).
export function arrowPulsePosition(
  loopSec: number,
  igniteKey: PhaseKey,
): number | null {
  if (!inPhase(loopSec, igniteKey)) return null;
  return easeInOutCubic(phaseProgress(loopSec, igniteKey));
}

// Champagne arrow-arrival blink intensity 0..1.
// Fires for ~50ms (~4% of a 1s phase) right at the END of the ignite phase
// when the pulse arrives at the destination cone.
export function arrowArrivalBlink(
  loopSec: number,
  igniteKey: PhaseKey,
): number {
  const { start, end } = PHASES[igniteKey];
  const blinkStart = end - 0.1; // 100ms window total: 50ms rise + 50ms fall
  if (loopSec < blinkStart || loopSec >= end + 0.1) return 0;
  const peak = end - 0.05;
  const dist = Math.abs(loopSec - peak) / 0.05; // 0 at peak, 1 at edges
  return Math.max(0, 1 - dist);
}

// FullAlive center accent intensity — fades up during fullAlive phase, drops
// during fadeOut. Used by the champagne center point light.
export function fullAliveAccentIntensity(loopSec: number): number {
  if (loopSec < PHASES.fullAlive.start) return 0;
  if (loopSec < PHASES.fullAlive.end) {
    return easeInOutCubic(phaseProgress(loopSec, "fullAlive"));
  }
  return 1 - easeOutQuad(phaseProgress(loopSec, "fadeOut"));
}

// Pulse intensity for arrow during fullAlive — continuous wave around the loop.
// Returns position 0..1 for one of the four arrows when running, else null.
export function fullAlivePulsePosition(
  loopSec: number,
  arrowIndex: number,
  arrowCount = 4,
): number | null {
  if (loopSec < PHASES.fullAlive.start || loopSec >= PHASES.fadeOut.start) {
    return null;
  }
  const localT = (loopSec - PHASES.fullAlive.start) /
    (PHASES.fadeOut.start - PHASES.fullAlive.start);
  // Each arrow's pulse is offset by 1/N of the loop so the wave travels.
  const offset = arrowIndex / arrowCount;
  return ((localT * 1.5 + offset) % 1);
}

// Mouse parallax — preserved from Pass 1.
export function useMouseParallax(enabled: boolean) {
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      target.current = { x, y };
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  return { target, current };
}

export function applyParallaxFrame(
  current: { x: number; y: number },
  target: { x: number; y: number },
): { rotX: number; rotY: number } {
  current.x += (target.x - current.x) * PARALLAX_LERP;
  current.y += (target.y - current.y) * PARALLAX_LERP;
  const rotY = (current.x * PARALLAX_MAX_X_DEG * Math.PI) / 180;
  const rotX = (current.y * PARALLAX_MAX_Y_DEG * Math.PI) / 180;
  return { rotX, rotY };
}

// Idle Y-rotation for a pillar — angle in radians from elapsed seconds and period.
export function idleYRotation(elapsedSeconds: number, periodSeconds: number): number {
  return (elapsedSeconds / periodSeconds) * Math.PI * 2;
}

// Public utility — used by clamp to normalize partial values where needed.
export { clamp01 };
