"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS } from "./constants";
import { fullAliveAccentIntensity, loopSeconds } from "./motion";

// Pass 3 lighting rig — three lights, no Environment IBL (deferred to Pass 4).
//
//   1. Key light    — cream upper-front-left, soft directional
//   2. Rim light    — brand-300 lower-back-right, signature edge glow
//   3. Center accent — champagne PointLight at loop center, animated 0 → 0.6
//                       during fullAlive phase ONLY (sanctioned champagne site #3).
export function SceneLighting() {
  const accentRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!accentRef.current) return;
    const t = loopSeconds(clock.elapsedTime);
    // Pass 5: push to 1.8 so the fullAlive moment pushes scene into HDR
    // for ACES tone mapping to compress.
    accentRef.current.intensity = fullAliveAccentIntensity(t) * 1.8;
  });

  return (
    <>
      {/* Soft ambient floor — keeps materials from going pitch black in shadow. */}
      <ambientLight intensity={0.18} color={COLORS.cream100} />

      {/* Key — cream, upper-front-left. Casts real geometric shadow onto the
          shadow-catching floor plane in Scene.tsx. */}
      <directionalLight
        position={[-3, 5, 3]}
        intensity={0.85}
        color={COLORS.cream100}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
      />

      {/* Rim — brand-blue, lower-back-right */}
      <directionalLight
        position={[3, -1, -3]}
        intensity={0.5}
        color={COLORS.brand300}
      />

      {/* Center accent — champagne, fullAlive only */}
      <pointLight
        ref={accentRef}
        position={[0, 0.4, 0]}
        color={COLORS.champagne200}
        intensity={0}
        distance={3}
        decay={2}
      />
    </>
  );
}
