"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Environment } from "@react-three/drei";
import { useInView } from "react-intersection-observer";
import { ProtocolsPillar } from "@/components/marketing/hero-3d/pillars/ProtocolsPillar";
import { DeliveryPillar } from "@/components/marketing/hero-3d/pillars/DeliveryPillar";
import { BiologicPillar } from "@/components/marketing/hero-3d/pillars/BiologicPillar";
import { DataPillar } from "@/components/marketing/hero-3d/pillars/DataPillar";
import { COLORS } from "@/components/marketing/hero-3d/constants";
import { useReducedMotion } from "@/components/marketing/hero-3d/motion";

export type PillarKey = "protocols" | "delivery" | "biologic" | "data";

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

type Props = {
  pillar: PillarKey;
  /** Optional camera override. Defaults to the homepage Section 3 angle:
   *  position [0, 0.5, 2.5], target [0, 0, 0], fov 36. */
  cameraPreset?: CameraPreset;
};

const DEFAULT_CAMERA_PRESET: CameraPreset = {
  position: [0, 0.5, 2.5],
  target: [0, 0, 0],
  fov: 36,
};

// Sets camera lookAt on mount + whenever target changes. R3F's <Canvas
// camera={...}> only sets position/fov; the camera stays oriented down -Z.
// We need explicit lookAt for non-trivial angles (bird's-eye, oblique, etc.).
function CameraSetup({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateProjectionMatrix();
  }, [camera, target]);
  return null;
}

const TABLET_BP = 768;

function PillarObject({ pillar, simplified }: { pillar: PillarKey; simplified: boolean }) {
  // Each pillar component has a different internal Y offset baked in. We wrap
  // with a counter-offset so the pillar's geometric center lands at world (0,0,0)
  // — which is where the camera target sits, so the pillar reads dead-center.
  //
  // Internal offsets:
  //   ProtocolsPillar:  [0, 0.35, 0]  — panels centered at Y=0.35
  //   DeliveryPillar:   [0, 0.5,  0]  — sphere center at Y=0.5 (radius 0.45)
  //   BiologicPillar:   [0, 0,    0]  — bottles 0→0.32, visual center ≈ Y=0.15
  //   DataPillar:       [0, 0.2,  0]  — flat torus, very thin, center at Y=0.2
  switch (pillar) {
    case "protocols":
      return (
        <group position={[0, -0.35, 0]}>
          <ProtocolsPillar simplified={simplified} />
        </group>
      );
    case "delivery":
      return (
        <group position={[0, -0.5, 0]}>
          <DeliveryPillar simplified={simplified} />
        </group>
      );
    case "biologic":
      // Bottle cluster is geometrically smaller than the other pillars
      // (~0.5 wide vs ~0.9 for protocols/delivery/data). Scale up to match
      // visual weight in the section frames. Y-offset adjusts for the 1.5×
      // taller cluster — keeps geometric center at world origin.
      return (
        <group position={[0, -0.22, 0]} scale={[1.5, 1.5, 1.5]}>
          <BiologicPillar simplified={simplified} />
        </group>
      );
    case "data":
      return (
        <group position={[0, -0.2, 0]}>
          <DataPillar simplified={simplified} />
        </group>
      );
  }
}

function StaticPlaceholder({ pillar }: { pillar: PillarKey }) {
  const labelMap: Record<PillarKey, string> = {
    protocols: "Protocols",
    delivery: "Delivery Mechanism",
    biologic: "Biologic Control",
    data: "Data Intelligence",
  };
  return (
    <div className="relative h-full w-full overflow-hidden bg-midnight-700">
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-display text-h3 text-brand-300/40 italic">
          {labelMap[pillar]}
        </p>
      </div>
    </div>
  );
}

type Tier = "static" | "tablet" | "desktop";
const DESKTOP_BP = 1024;

export default function SinglePillarScene({ pillar, cameraPreset }: Props) {
  const preset = cameraPreset ?? DEFAULT_CAMERA_PRESET;
  const [tier, setTier] = useState<Tier | null>(null);
  const reducedMotion = useReducedMotion();
  const { ref, inView } = useInView({ threshold: 0.05 });

  useEffect(() => {
    const compute = (): Tier => {
      const w = window.innerWidth;
      if (w < TABLET_BP) return "static";
      if (w < DESKTOP_BP) return "tablet";
      return "desktop";
    };
    setTier(compute());
    const onResize = () => setTier(compute());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Pre-hydration / mobile / reduced-motion → styled placeholder (no canvas).
  if (tier === null || tier === "static" || reducedMotion) {
    return <StaticPlaceholder pillar={pillar} />;
  }

  const simplified = tier === "tablet";

  return (
    <div ref={ref} className="relative h-full w-full">
      <Canvas
        camera={{ position: preset.position, fov: preset.fov }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.95,
        }}
        frameloop={inView ? "always" : "demand"}
        style={{ background: "transparent" }}
      >
        <CameraSetup target={preset.target} />
        <Suspense fallback={null}>
          <Environment files="/hdr/warehouse_1k.hdr" background={false} />
        </Suspense>
        {/* Soft 3-light rig — matches hero rig color palette but tighter for a single object */}
        <ambientLight intensity={0.2} color={COLORS.cream100} />
        <directionalLight position={[-2.5, 4, 2.5]} intensity={0.8} color={COLORS.cream100} />
        <directionalLight position={[2.5, -1, -2.5]} intensity={0.4} color={COLORS.brand300} />
        <PillarObject pillar={pillar} simplified={simplified} />
      </Canvas>
    </div>
  );
}
