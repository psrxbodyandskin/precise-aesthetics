"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const MONOGRAM_PATH =
  "/brand/precise-aesthetics-brand-identity/assets/logos/precise-aesthetics-monogram-navy-400.png";

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

  // PA monogram label texture — placed on each bottle's outer face like a
  // printed label. Loaded imperatively to avoid Suspense interaction with
  // the postprocessing pipeline.
  const [monogramTex, setMonogramTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      MONOGRAM_PATH,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        setMonogramTex(tex);
      },
      undefined,
      () => {
        setMonogramTex(null);
      },
    );
  }, []);

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
        // Each bottle's PA label faces OUTWARD from the cluster center — gives
        // the rotating cluster visual variety (PAs on near-side bottles read,
        // far-side ones rotate around).
        const outwardAngle = Math.atan2(b.pos[0], b.pos[1]);
        const ox = Math.sin(outwardAngle);
        const oz = Math.cos(outwardAngle);
        const labelOffset = b.rTop + 0.002;
        // Label sized ~70% of bottle width, capped so it fits vertically.
        const labelSize = Math.min(b.rTop * 1.3, b.height * 0.55);
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
            {/* PA monogram label — printed on the outer face of the bottle */}
            {monogramTex && (
              <mesh
                position={[ox * labelOffset, cy, oz * labelOffset]}
                rotation={[0, outwardAngle, 0]}
              >
                <planeGeometry args={[labelSize, labelSize]} />
                <meshBasicMaterial
                  map={monogramTex}
                  transparent
                  opacity={0.92}
                  toneMapped={false}
                  depthWrite={false}
                />
              </mesh>
            )}
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
