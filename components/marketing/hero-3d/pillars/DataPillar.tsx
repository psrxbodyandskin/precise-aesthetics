"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  DATA_PARTICLE_COUNT_DESKTOP,
  DATA_PARTICLE_COUNT_TABLET,
  DATA_TORUS_RADIAL_DESKTOP,
  DATA_TORUS_RADIAL_TABLET,
  DATA_TORUS_TUBULAR_DESKTOP,
  DATA_TORUS_TUBULAR_TABLET,
  EMISSIVE_AMBIENT,
  EMISSIVE_IGNITED,
  IDLE_ROTATION_SECONDS,
} from "../constants";
import {
  createDataInnerTorusMaterial,
  createDataParticleMaterial,
  createDataTorusMaterial,
} from "../materials";
import { idleYRotation, loopSeconds, pillarLitMix } from "../motion";

type Props = { simplified?: boolean };

// Full glowing torus oriented horizontally (lying flat) with particle stream
// flowing along the tube path. Inner companion torus on desktop only.
export function DataPillar({ simplified = false }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const torusMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const innerMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const particlesRef = useRef<THREE.InstancedMesh>(null);

  const particleCount = simplified
    ? DATA_PARTICLE_COUNT_TABLET
    : DATA_PARTICLE_COUNT_DESKTOP;
  const tubularSegments = simplified
    ? DATA_TORUS_TUBULAR_TABLET
    : DATA_TORUS_TUBULAR_DESKTOP;
  const radialSegments = simplified
    ? DATA_TORUS_RADIAL_TABLET
    : DATA_TORUS_RADIAL_DESKTOP;

  const torusMaterial = useMemo(() => createDataTorusMaterial(), []);
  const innerMaterial = useMemo(() => createDataInnerTorusMaterial(), []);
  const particleMaterial = useMemo(() => createDataParticleMaterial(), []);

  // Per-particle seeds: initial offset along ring + speed multiplier.
  const seeds = useMemo(() => {
    const arr: { offset: number; speed: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      // Deterministic pseudo-random.
      const x = Math.sin(i * 12.9898) * 43758.5453;
      const r1 = x - Math.floor(x);
      const y = Math.sin(i * 78.233) * 43758.5453;
      const r2 = y - Math.floor(y);
      arr.push({
        offset: r1, // 0..1
        speed: 0.06 + r2 * 0.05, // 0.06..0.11 revolutions/sec → organic, not synced
      });
    }
    return arr;
  }, [particleCount]);

  // Torus params (geometry-level).
  const torusRadius = 0.4;
  const torusTube = 0.06;

  // Compute particle position for a given normalized offset around the ring.
  const computeParticlePosition = (t: number): THREE.Vector3 => {
    const angle = t * Math.PI * 2;
    return new THREE.Vector3(
      Math.cos(angle) * torusRadius,
      0,
      Math.sin(angle) * torusRadius,
    );
  };

  useEffect(() => {
    if (!particlesRef.current) return;
    const dummy = new THREE.Object3D();
    seeds.forEach((s, i) => {
      const p = computeParticlePosition(s.offset);
      dummy.position.copy(p);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      particlesRef.current!.setMatrixAt(i, dummy.matrix);
    });
    particlesRef.current.instanceMatrix.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seeds]);

  useFrame(({ clock }) => {
    if (!groupRef.current || !particlesRef.current) return;

    // Group rotation 1/20s.
    groupRef.current.rotation.y = idleYRotation(
      clock.elapsedTime,
      IDLE_ROTATION_SECONDS.data,
    );

    // Phase-driven emissive ramp + speed boost.
    const t = loopSeconds(clock.elapsedTime);
    const lit = pillarLitMix(t, "dataOn");
    const intensity = EMISSIVE_AMBIENT + lit * (EMISSIVE_IGNITED - EMISSIVE_AMBIENT);
    if (torusMatRef.current) torusMatRef.current.emissiveIntensity = intensity * 1.4;
    if (innerMatRef.current) innerMatRef.current.emissiveIntensity = intensity;

    // Particle positions update each frame. Speed multiplier rises with `lit`.
    const speedBoost = 1 + lit * 1.5;
    const dummy = new THREE.Object3D();
    const elapsed = clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const tNorm = (s.offset + s.speed * speedBoost * elapsed) % 1;
      const p = computeParticlePosition(tNorm);
      dummy.position.copy(p);
      const scale = 0.9 + lit * 0.4; // particles get larger as ignited
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      particlesRef.current.setMatrixAt(i, dummy.matrix);
    }
    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  // Pillar group: lying flat (torus default is in XY; rotate to XZ — "lying flat").
  // Sits at small Y offset above pedestal top.
  return (
    <group ref={groupRef} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Main torus */}
      <mesh>
        <torusGeometry
          args={[torusRadius, torusTube, radialSegments, tubularSegments]}
        />
        <primitive object={torusMaterial} attach="material" ref={torusMatRef} />
      </mesh>

      {/* Inner companion torus (desktop only) */}
      {!simplified && (
        <mesh>
          <torusGeometry args={[torusRadius * 1.12, torusTube * 0.7, 24, 192]} />
          <primitive object={innerMaterial} attach="material" ref={innerMatRef} />
        </mesh>
      )}

      {/* Particle stream — InstancedMesh of small spheres */}
      <instancedMesh
        ref={particlesRef}
        args={[undefined, undefined, particleCount]}
        material={particleMaterial}
      >
        <sphereGeometry args={[0.012, 12, 12]} />
      </instancedMesh>
    </group>
  );
}
