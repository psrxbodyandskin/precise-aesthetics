"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  EMISSIVE_AMBIENT,
  EMISSIVE_IGNITED,
  PEDESTAL_RADIUS,
  type PhaseKey,
} from "../constants";
import { createPedestalRimMaterial } from "../materials";
import { loopSeconds, pillarLitMix } from "../motion";

type Props = {
  position: [number, number, number];
  igniteKey: PhaseKey;
  children: React.ReactNode;
};

// Pass 5: pedestal cylinders dropped. The shared ReflectiveFloor handles ground;
// each pillar now just has a thin glowing ring at floor level marking its spot.
// Ring brightens during the pillar's ignite phase per the activation sequence.
export function Pedestal({ position, igniteKey, children }: Props) {
  const rimMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rimMaterial = useMemo(() => createPedestalRimMaterial(), []);

  useFrame(({ clock }) => {
    if (!rimMatRef.current) return;
    const lit = pillarLitMix(loopSeconds(clock.elapsedTime), igniteKey);
    rimMatRef.current.emissiveIntensity =
      EMISSIVE_AMBIENT + lit * (EMISSIVE_IGNITED - EMISSIVE_AMBIENT);
    rimMatRef.current.opacity = 0.4 + lit * 0.55;
  });

  const rimRadius = PEDESTAL_RADIUS;
  // Thin ring sits flush on the floor.
  return (
    <group position={position}>
      <mesh position={[0, 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[rimRadius * 0.94, rimRadius, 96]} />
        <primitive object={rimMaterial} ref={rimMatRef} attach="material" />
      </mesh>
      {/* Pillar object sits at floor level (no pedestal lift). */}
      <group>{children}</group>
    </group>
  );
}
