"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS } from "../constants";

// Floating dust/spec particles in the scene volume — adds depth, breath, and
// "rendered space" feel. Custom shader with soft circular point sprite +
// per-particle drift that wraps in a bounded volume.
//
// The refs all have this kind of ambient motion in the air around the objects;
// without it the scene reads like an empty void.

const vert = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    // Gentle drift on Y based on per-particle phase.
    p.y += sin(uTime * 0.18 + aPhase) * 0.12;
    p.x += cos(uTime * 0.12 + aPhase * 1.3) * 0.06;

    vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aSize * (60.0 / -mvPos.z);

    // Distance-based fade: particles farther from camera are dimmer.
    float dist = -mvPos.z;
    vAlpha = smoothstep(9.0, 4.0, dist) * 0.32;
  }
`;

const frag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(uColor, a);
  }
`;

type Props = {
  count?: number;
  // Bounding volume for particle placement (around scene center).
  bounds?: { x: number; y: { min: number; max: number }; z: number };
};

export function AtmosphericParticles({
  count = 220,
  bounds = { x: 4, y: { min: 0.1, max: 3.5 }, z: 3 },
}: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, phases, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const phs = new Float32Array(count);
    const szs = new Float32Array(count);
    // Deterministic distribution for SSR/static stability.
    for (let i = 0; i < count; i++) {
      const r1 = (Math.sin(i * 12.9898 + 1.7) * 43758.5453) % 1;
      const r2 = (Math.sin(i * 78.233 + 3.4) * 43758.5453) % 1;
      const r3 = (Math.sin(i * 39.346 + 5.9) * 43758.5453) % 1;
      const r4 = (Math.sin(i * 91.534 + 0.3) * 43758.5453) % 1;
      const u1 = ((r1 + 1) % 1) * 2 - 1; // -1..1
      const u2 = ((r2 + 1) % 1);
      const u3 = ((r3 + 1) % 1) * 2 - 1;
      const u4 = ((r4 + 1) % 1);
      pos[i * 3] = u1 * bounds.x;
      pos[i * 3 + 1] = bounds.y.min + u2 * (bounds.y.max - bounds.y.min);
      pos[i * 3 + 2] = u3 * bounds.z;
      phs[i] = u4 * Math.PI * 2;
      szs[i] = 0.4 + ((Math.sin(i * 5.31 + 0.8) + 1) * 0.5) * 0.6; // 0.4..1.0
    }
    return { positions: pos, phases: phs, sizes: szs };
  }, [count, bounds.x, bounds.y.min, bounds.y.max, bounds.z]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [positions, phases, sizes]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(COLORS.cream100) },
        },
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <points geometry={geometry}>
      <primitive object={material} attach="material" ref={matRef} />
    </points>
  );
}
