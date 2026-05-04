"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { PhaseKey } from "../constants";
import { loopSeconds, pillarLitMix } from "../motion";

type Props = {
  position: [number, number, number];
  label: string;
  igniteKey: PhaseKey;
  yOffset?: number;
  /** Fraction toward scene origin (0 = at pillar, 1 = at origin). */
  inwardPull?: number;
  /** Per-pillar XZ offset in pillar-local space. Lets labels be re-centered
   *  over the geometry's visual centroid without moving the geometry itself. */
  xOffset?: number;
  zOffset?: number;
};

// Floating HTML label that appears next to each pillar when it lights up.
// Lives inside the spin group so it tracks the rotating pillar in screen
// space. Opacity is driven by the same pillarLitMix that drives the pillar's
// emissive — fades in during ignite, holds through fullAlive, fades out.
export function PillarLabel({
  position,
  label,
  igniteKey,
  yOffset = 1.4,
  inwardPull = 0,
  xOffset = 0,
  zOffset = 0,
}: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  // Pull labels toward the scene origin on small canvases so they stay
  // inside the frame as pillars rotate. The base XZ position is
  // multiplied by `radiusScale` so the entire label orbit shrinks on
  // narrow canvases without changing pillar geometry positions.
  const canvasWidth = useThree((s) => s.size.width);
  const radiusScale = canvasWidth < 500 ? 0.75 : 1;

  useFrame(({ clock }) => {
    if (!elRef.current) return;
    const lit = pillarLitMix(loopSeconds(clock.elapsedTime), igniteKey);
    elRef.current.style.opacity = String(lit);
    // Drei <Html center> already centers the wrapper. Only animate Y here.
    elRef.current.style.transform = `translateY(${(1 - lit) * 8}px)`;
  });

  const labelX =
    (position[0] * (1 - inwardPull) + xOffset) * radiusScale;
  const labelZ =
    (position[2] * (1 - inwardPull) + zOffset) * radiusScale;

  return (
    <group position={[labelX, position[1] + yOffset, labelZ]}>
      <Html
        center
        zIndexRange={[10, 0]}
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          ref={elRef}
          style={{
            opacity: 0,
            transform: "translateY(8px)",
            transition: "none",
            fontFamily:
              "var(--font-body), Inter, -apple-system, sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#A8C8E8",
            whiteSpace: "nowrap",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}
