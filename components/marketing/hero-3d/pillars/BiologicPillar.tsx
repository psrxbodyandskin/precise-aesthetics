"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  EMISSIVE_AMBIENT,
  EMISSIVE_IGNITED,
  IDLE_ROTATION_SECONDS,
} from "../constants";
import { createBottleMaterial, createCapMaterial } from "../materials";
import { idleYRotation, loopSeconds, pillarLitMix } from "../motion";

type Props = { simplified?: boolean };

// Cluster of 5–7 cylindrical containers with champagne caps.
// Heights and widths vary per spec; arranged informally on the pedestal top.
type Bottle = {
  rTop: number;
  rBot: number;
  height: number;
  capHeight: number;
  pos: [number, number]; // x, z on pedestal top
};

const BOTTLES: readonly Bottle[] = [
  { rTop: 0.10, rBot: 0.10, height: 0.32, capHeight: 0.025, pos: [-0.18, -0.05] },  // tall slim
  { rTop: 0.14, rBot: 0.14, height: 0.20, capHeight: 0.022, pos: [0.05, 0.13] },     // squat jar
  { rTop: 0.08, rBot: 0.08, height: 0.28, capHeight: 0.020, pos: [0.20, -0.10] },    // narrow vial
  { rTop: 0.12, rBot: 0.12, height: 0.16, capHeight: 0.022, pos: [-0.08, 0.15] },    // small wide jar
  { rTop: 0.09, rBot: 0.09, height: 0.24, capHeight: 0.020, pos: [-0.22, 0.06] },    // medium bottle
  { rTop: 0.07, rBot: 0.07, height: 0.18, capHeight: 0.018, pos: [0.16, 0.04] },     // small accent
];

export function BiologicPillar({ simplified = false }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const bottleMaterial = useMemo(() => createBottleMaterial(), []);
  const capMaterial = useMemo(() => createCapMaterial(), []);
  const bottleMatRef = useRef(bottleMaterial);
  const capMatRef = useRef(capMaterial);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = idleYRotation(
      clock.elapsedTime,
      IDLE_ROTATION_SECONDS.biologic,
    );
    const lit = pillarLitMix(loopSeconds(clock.elapsedTime), "biologicOn");
    // Bottles glow softly; caps gleam brighter.
    bottleMatRef.current.emissive = new THREE.Color("#F4F0E8");
    bottleMatRef.current.emissiveIntensity = lit * 0.35;
    capMatRef.current.emissive = new THREE.Color("#E8DCC4");
    capMatRef.current.emissiveIntensity = EMISSIVE_AMBIENT * 0.5 + lit * (EMISSIVE_IGNITED * 0.6);
  });

  const radialSeg = simplified ? 24 : 64;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {BOTTLES.map((b, i) => {
        const cy = b.height / 2;
        const capY = b.height + b.capHeight / 2;
        return (
          <group key={i} position={[b.pos[0], 0, b.pos[1]]}>
            {/* Bottle body */}
            <mesh position={[0, cy, 0]}>
              <cylinderGeometry args={[b.rTop, b.rBot, b.height, radialSeg]} />
              <primitive
                object={i === 0 ? bottleMaterial : bottleMaterial.clone()}
                attach="material"
                ref={i === 0 ? bottleMatRef : undefined}
              />
            </mesh>
            {/* Cap */}
            <mesh position={[0, capY, 0]}>
              <cylinderGeometry
                args={[b.rTop * 1.05, b.rTop * 1.05, b.capHeight, radialSeg]}
              />
              <primitive
                object={i === 0 ? capMaterial : capMaterial.clone()}
                attach="material"
                ref={i === 0 ? capMatRef : undefined}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
