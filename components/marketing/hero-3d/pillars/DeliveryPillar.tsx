"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import {
  COLORS,
  IDLE_ROTATION_SECONDS,
} from "../constants";
import { createDeliveryBodyMaterial } from "../materials";
import { idleYRotation, loopSeconds, pillarLitMix } from "../motion";

type Props = { simplified?: boolean };

const MONOGRAM_PATH =
  "/brand/precise-aesthetics-brand-identity/assets/logos/precise-aesthetics-monogram-cream-400.png";

// Translucent glowing sphere with the PA monogram suspended inside. The shell
// uses transmission so the inner logo reads through; both shell and logo
// brighten when the device pillar charges (ignite phase).
//
// Texture loaded imperatively to avoid Suspense triggering inside the
// EffectComposer pipeline (causes a postprocessing crash on null context attrs).
export function DeliveryPillar({ simplified = false }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const monoSpinRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const monoMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const material = useMemo(() => createDeliveryBodyMaterial(), []);
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
        // Fail silently — sphere still renders without the logo.
        setMonogramTex(null);
      },
    );
  }, []);

  const radius = 0.45;
  const segments = simplified ? 32 : 64;

  const IDLE_EMISSIVE = 0.35;
  const CHARGED_EMISSIVE = 2.4;

  // PA monogram spins faster than the sphere — 1 rev / 8s.
  const PA_SPIN_SECONDS = 8;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = idleYRotation(
      clock.elapsedTime,
      IDLE_ROTATION_SECONDS.delivery,
    );
    if (monoSpinRef.current) {
      // Negative = clockwise from camera POV.
      monoSpinRef.current.rotation.y =
        -(clock.elapsedTime / PA_SPIN_SECONDS) * Math.PI * 2;
    }
    const t = loopSeconds(clock.elapsedTime);
    const lit = pillarLitMix(t, "deliveryOn");
    if (matRef.current) {
      matRef.current.emissiveIntensity =
        IDLE_EMISSIVE + lit * (CHARGED_EMISSIVE - IDLE_EMISSIVE);
    }
    if (monoMatRef.current) {
      monoMatRef.current.opacity = 0.7 + lit * 0.3;
    }
    if (lightRef.current) {
      lightRef.current.intensity = lit * 1.6;
    }
  });

  return (
    <group ref={groupRef} position={[0, radius + 0.05, 0]}>
      {/* Translucent glowing shell */}
      <mesh>
        <sphereGeometry args={[radius, segments, segments]} />
        <primitive object={material} attach="material" ref={matRef} />
      </mesh>

      {/* PA monogram inside — rotates with the sphere's parent group so it
          maintains the 3D illusion (occasionally turns edge-on as the sphere
          rotates). DoubleSide so it's visible from both faces. */}
      {monogramTex && (
        <>
          {/* PA texture plane — spins independently at 1 rev / 8s. */}
          <group ref={monoSpinRef}>
            <mesh renderOrder={2}>
              <planeGeometry args={[radius * 1.25, radius * 1.25]} />
              <meshBasicMaterial
                ref={monoMatRef}
                map={monogramTex}
                transparent
                opacity={1}
                toneMapped={false}
                depthWrite={false}
                depthTest={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
          {/* | divider bar — stays with the parent group (sphere rotation). */}
          <mesh renderOrder={3} position={[0, 0, 0.001]}>
            <planeGeometry args={[radius * 0.022, radius * 0.78]} />
            <meshBasicMaterial
              color={COLORS.brand300}
              transparent
              opacity={0.95}
              toneMapped={false}
              depthWrite={false}
              depthTest={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}

      <pointLight
        ref={lightRef}
        color={COLORS.brand300}
        intensity={0}
        distance={2.4}
        decay={1.6}
      />
    </group>
  );
}
