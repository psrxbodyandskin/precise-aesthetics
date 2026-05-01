"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useInView } from "react-intersection-observer";
import {
  BREAKPOINT_DESKTOP_PX,
  BREAKPOINT_TABLET_PX,
  CAMERA_FOV,
  CAMERA_POSITION,
  type Tier,
} from "./constants";
import { Scene } from "./Scene";
import { StaticFallback } from "./StaticFallback";
import { useReducedMotion } from "./motion";

function useTier(): Tier | null {
  const [tier, setTier] = useState<Tier | null>(null);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < BREAKPOINT_TABLET_PX) return "static";
      if (w < BREAKPOINT_DESKTOP_PX) return "tablet";
      return "desktop";
    };
    setTier(compute());
    const onResize = () => setTier(compute());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return tier;
}

export default function ConvergenceHero() {
  const tier = useTier();
  const reducedMotion = useReducedMotion();
  const { ref, inView } = useInView({ threshold: 0.05 });

  // Pre-hydration / mobile / reduced-motion → static silhouette only.
  const useStatic = tier === null || tier === "static" || reducedMotion;

  return (
    <div
      ref={ref}
      className="relative aspect-square w-full max-w-[620px] mx-auto"
      role="img"
      aria-label="A visualization of the four-pillar Precise System: Protocols, Delivery Mechanism, Data Intelligence, and Biologic Control, connected in a closed loop."
    >
      {useStatic ? (
        <StaticFallback />
      ) : (
        <Canvas
          camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
          dpr={[1, 2]}
          shadows="soft"
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.95,
          }}
          frameloop={inView ? "always" : "demand"}
          style={{ background: "transparent" }}
        >
          <Scene tier={tier as "tablet" | "desktop"} />
        </Canvas>
      )}
    </div>
  );
}
