"use client";

import { useMemo } from "react";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { COLORS } from "../constants";

// One large reflective dark plane below the pillars. Replaces the four individual
// cylinder pedestal discs with a unified premium "studio floor" that catches
// subtle reflections of the objects above. The rim-glow rings still mark each
// pillar position via the simplified Pedestal component.
export function ReflectiveFloor() {
  const radialGradient = useMemo(() => {
    // Subtle vignetted alpha gradient so the floor fades to transparent at edges.
    // Avoids hard floor-meets-backdrop seam.
    return new THREE.Color(COLORS.midnight800);
  }, []);

  return (
    <mesh
      position={[0, -0.001, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <circleGeometry args={[6, 64]} />
      <MeshReflectorMaterial
        color={radialGradient}
        blur={[400, 100]}
        resolution={512}
        mixBlur={1.0}
        mixStrength={0.45}
        roughness={0.85}
        depthScale={0.4}
        minDepthThreshold={0.85}
        maxDepthThreshold={1.4}
        metalness={0.2}
        mirror={0}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}
