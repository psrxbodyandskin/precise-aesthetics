"use client";

import { Suspense, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Environment } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { PEDESTAL_POSITIONS, PILLAR_ORDER, SCENE_SPIN_SECONDS } from "./constants";
import { Pedestal } from "./components/Pedestal";
import { FlowArrow } from "./components/FlowArrow";
import { PillarLabel } from "./components/PillarLabel";
import { ProtocolsPillar } from "./pillars/ProtocolsPillar";
import { DeliveryPillar } from "./pillars/DeliveryPillar";
import { DataPillar } from "./pillars/DataPillar";
import { BiologicPillar } from "./pillars/BiologicPillar";
import { SceneLighting } from "./lighting";
import { applyParallaxFrame, useMouseParallax } from "./motion";

type Props = { tier: "tablet" | "desktop" };

const PILLAR_IGNITE = {
  protocols: "protocolsOn",
  delivery: "deliveryOn",
  data: "dataOn",
  biologic: "biologicOn",
} as const;

const PILLAR_LABEL = {
  protocols: "Protocols",
  delivery: "Device Mechanism",
  data: "Data Intelligence",
  biologic: "Biologic Control",
} as const;

// Arrow chain: protocols → delivery → biologic → data → protocols (Pass 4).
const ARROWS = [
  { from: "protocols", to: "delivery", igniteKey: "arrowProtoDel" },
  { from: "delivery", to: "biologic", igniteKey: "arrowDelBio" },
  { from: "biologic", to: "data", igniteKey: "arrowBioData" },
  { from: "data", to: "protocols", igniteKey: "arrowDataProto" },
] as const;

export function Scene({ tier }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const simplified = tier === "tablet";
  const parallaxEnabled = tier === "desktop";
  const { target, current } = useMouseParallax(parallaxEnabled);
  const { scene } = useThree();

  // Enable shadow casting on every mesh in the scene. Meshes that come/go later
  // (instanced particles, runtime additions) won't be touched, but our static
  // pillar geometry will all cast accurate silhouette shadows onto the floor.
  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        // Shadow-catching plane and emissive ribbons/sparkles should not cast.
        const isShadowCatcher =
          m.material instanceof THREE.ShadowMaterial;
        const isAdditive =
          m.material instanceof THREE.MeshBasicMaterial &&
          m.material.blending === THREE.AdditiveBlending;
        if (!isShadowCatcher && !isAdditive) {
          m.castShadow = true;
        }
      }
    });
  }, [scene]);

  useFrame(({ clock }) => {
    // Continuous Y-axis spin on the inner group — full revolution per SCENE_SPIN_SECONDS.
    if (spinRef.current) {
      spinRef.current.rotation.y =
        -(clock.elapsedTime / SCENE_SPIN_SECONDS) * Math.PI * 2;
    }
    // Mouse parallax on the outer group — independent of the spin.
    if (groupRef.current && parallaxEnabled) {
      const { rotX, rotY } = applyParallaxFrame(current.current, target.current);
      groupRef.current.rotation.x = rotX;
      groupRef.current.rotation.y = rotY;
    }
  });

  const renderPillar = (key: typeof PILLAR_ORDER[number]) => {
    switch (key) {
      case "protocols":
        return <ProtocolsPillar simplified={simplified} />;
      case "delivery":
        return <DeliveryPillar simplified={simplified} />;
      case "data":
        return <DataPillar simplified={simplified} />;
      case "biologic":
        return <BiologicPillar simplified={simplified} />;
    }
  };

  return (
    <>
      {/* Self-hosted warehouse HDR — image-based reflections in clearcoat materials.
          Wrapped in its own Suspense so the rest of the scene renders immediately
          while the HDR loads. background={false} keeps canvas transparent. */}
      <Suspense fallback={null}>
        <Environment files="/hdr/warehouse_1k.hdr" background={false} />
      </Suspense>
      <SceneLighting />
      {/* Invisible plane that catches real geometric shadows from the directional
          light. Each pillar's actual silhouette projects here — accurate per
          object instead of the old ContactShadows blob. */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[14, 14]} />
        <shadowMaterial opacity={0.55} transparent />
      </mesh>
      <group ref={groupRef}>
        <group ref={spinRef}>
          {PILLAR_ORDER.map((key) => (
            <Pedestal
              key={key}
              position={PEDESTAL_POSITIONS[key] as [number, number, number]}
              igniteKey={PILLAR_IGNITE[key]}
            >
              {renderPillar(key)}
            </Pedestal>
          ))}
          {ARROWS.map((arrow, i) => (
            <FlowArrow
              key={`${arrow.from}-${arrow.to}`}
              from={PEDESTAL_POSITIONS[arrow.from] as [number, number, number]}
              to={PEDESTAL_POSITIONS[arrow.to] as [number, number, number]}
              igniteKey={arrow.igniteKey}
              arrowIndex={i}
              simplified={simplified}
            />
          ))}
          {/* Floating labels — each one centered directly above its pillar. */}
          {PILLAR_ORDER.map((key) => (
            <PillarLabel
              key={`label-${key}`}
              position={PEDESTAL_POSITIONS[key] as [number, number, number]}
              label={PILLAR_LABEL[key]}
              igniteKey={PILLAR_IGNITE[key]}
            />
          ))}
        </group>
      </group>

      {/* Subtle bloom on emissive elements. Desktop only — tablet drops it for perf.
          ACES Filmic tone mapping is applied by the renderer (gl.toneMapping in
          ConvergenceHero); EffectComposer respects the renderer's tone mapping at
          the final canvas write. */}
      {!simplified && (
        <EffectComposer multisampling={4}>
          <Bloom
            intensity={0.18}
            radius={0.5}
            luminanceThreshold={0.75}
            luminanceSmoothing={0.4}
            mipmapBlur
          />
          <Vignette
            offset={0.55}
            darkness={0.4}
            eskil={false}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      )}
    </>
  );
}
