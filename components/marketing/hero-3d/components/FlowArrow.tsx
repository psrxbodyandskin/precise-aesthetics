"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS, PEDESTAL_HEIGHT, type PhaseKey } from "../constants";
import {
  arrowArrivalBlink,
  arrowLitMix,
  arrowPulsePosition,
  fullAlivePulsePosition,
  loopSeconds,
} from "../motion";

type Props = {
  from: [number, number, number];
  to: [number, number, number];
  igniteKey: PhaseKey;
  arrowIndex: number;
  simplified?: boolean;
};

// Painterly ribbon material — flat plane following the curve, custom shader for
// edge fade + animated gradient flow + lit-state color shift. Replaces Pass 4's
// neon TubeGeometry which read as "circuit board" rather than "energy ribbon."
const ribbonVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ribbonFragment = /* glsl */ `
  uniform float uTime;
  uniform float uLit;        // 0..1 — pillar ignite progress
  uniform float uPulse;      // 0..1 — pulse position along ribbon, -1 if no pulse
  uniform float uPulseActive;// 0 or 1
  uniform vec3  uBaseColor;  // ink-700 idle
  uniform vec3  uLitColor;   // brand-300 active
  varying vec2 vUv;

  void main() {
    // Edge fade across width — soft taper to transparent at top/bottom of ribbon.
    float edge = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.65, vUv.y);

    // Length fade — slight taper at start/end of ribbon so it doesn't end flat.
    float lengthFade = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x);

    // Base color blends from base (idle) → brand-300 (lit).
    vec3 col = mix(uBaseColor, uLitColor, uLit);

    // Idle visibility — clearly defined even when not lit.
    float idleAlpha = 0.55 + uLit * 0.4;

    // Traveling glow band — bright bump moves along the ribbon during pulse.
    float pulseGlow = 0.0;
    if (uPulseActive > 0.5) {
      float dist = abs(vUv.x - uPulse);
      pulseGlow = exp(-dist * dist * 80.0);
      col = mix(col, vec3(0.95, 0.96, 1.0), pulseGlow * 0.7);
    }

    // Animated gradient flow during lit phase — subtle shimmer.
    float shimmer = 0.0;
    if (uLit > 0.1) {
      float wave = sin((vUv.x * 6.0) - uTime * 1.6);
      shimmer = (wave * 0.5 + 0.5) * 0.18 * uLit;
    }

    float alpha = edge * lengthFade * (idleAlpha + pulseGlow * 0.8 + shimmer);
    gl_FragColor = vec4(col + pulseGlow * 0.6 + shimmer, alpha);
  }
`;

// Sparkle particle shader — soft circular point sprite, fades by distance from center.
const sparkleVertex = /* glsl */ `
  attribute float aOffset;     // initial t along curve [0..1]
  attribute float aSpeed;      // multiplier for travel rate
  attribute float aSize;       // per-particle base size
  uniform float uTime;
  uniform float uLit;
  uniform vec3 uPath[64];      // sampled curve points
  varying float vAlpha;

  void main() {
    // Travel along curve — wraps every cycle.
    float t = mod(aOffset + uTime * aSpeed * (0.4 + uLit * 0.6), 1.0);
    float idx = t * 63.0;
    int i0 = int(floor(idx));
    int i1 = i0 + 1;
    if (i1 > 63) i1 = 63;
    float lerpT = idx - float(i0);
    vec3 pos = mix(uPath[i0], uPath[i1], lerpT);

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aSize * (200.0 / -mvPos.z) * (0.6 + uLit * 0.4);

    // Fade in/out across length to avoid pop at wrap.
    vAlpha = (0.4 + uLit * 0.6) * smoothstep(0.0, 0.1, t) * smoothstep(1.0, 0.9, t);
  }
`;

const sparkleFragment = /* glsl */ `
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

export function FlowArrow({ from, to, igniteKey, arrowIndex, simplified = false }: Props) {
  const yLift = PEDESTAL_HEIGHT + 0.05;
  const fromV = useMemo(
    () => new THREE.Vector3(from[0], from[1] + yLift, from[2]),
    [from, yLift],
  );
  const toV = useMemo(
    () => new THREE.Vector3(to[0], to[1] + yLift, to[2]),
    [to, yLift],
  );

  // Curve: bezier bowing outward from world center in XZ plane.
  const curve = useMemo(() => {
    const mid = fromV.clone().add(toV).multiplyScalar(0.5);
    const outward = new THREE.Vector3(mid.x, 0, mid.z).normalize();
    const offset = 0.45;
    const control = mid.clone().add(outward.multiplyScalar(offset));
    return new THREE.QuadraticBezierCurve3(fromV, control, toV);
  }, [fromV, toV]);

  // Build ribbon geometry — flat strip following the curve, with width.
  const ribbonGeometry = useMemo(() => {
    const segments = simplified ? 64 : 160;
    const width = 0.08;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const side = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const a = p.clone().add(side.clone().multiplyScalar(width / 2));
      const b = p.clone().add(side.clone().multiplyScalar(-width / 2));
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      uvs.push(t, 1, t, 0);
    }
    for (let i = 0; i < segments; i++) {
      const v0 = i * 2;
      indices.push(v0, v0 + 1, v0 + 2, v0 + 1, v0 + 3, v0 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [curve, simplified]);

  // Sample curve into 64 fixed points for sparkle path uniform.
  const pathSamples = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < 64; i++) {
      arr.push(curve.getPoint(i / 63));
    }
    return arr;
  }, [curve]);

  // Sparkle particle attributes.
  const sparkleCount = simplified ? 18 : 36;
  const sparkleAttrs = useMemo(() => {
    const offsets = new Float32Array(sparkleCount);
    const speeds = new Float32Array(sparkleCount);
    const sizes = new Float32Array(sparkleCount);
    for (let i = 0; i < sparkleCount; i++) {
      const r1 = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const r2 = (Math.sin(i * 78.233) * 43758.5453) % 1;
      const r3 = (Math.sin(i * 39.346) * 43758.5453) % 1;
      offsets[i] = ((r1 + 1) % 1);
      speeds[i] = 0.08 + ((r2 + 1) % 1) * 0.05;
      sizes[i] = 0.6 + ((r3 + 1) % 1) * 0.6;
    }
    return { offsets, speeds, sizes };
  }, [sparkleCount]);

  // Ribbon material with custom shader.
  const ribbonMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uLit: { value: 0 },
          uPulse: { value: 0 },
          uPulseActive: { value: 0 },
          uBaseColor: { value: new THREE.Color(COLORS.brand500) },
          uLitColor: { value: new THREE.Color(COLORS.brand300) },
        },
        vertexShader: ribbonVertex,
        fragmentShader: ribbonFragment,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  // Sparkle Points geometry — 1 vertex per particle, attribute-driven.
  const sparkleGeometry = useMemo(() => {
    const positions = new Float32Array(sparkleCount * 3); // dummy, shader uses attrs
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aOffset", new THREE.BufferAttribute(sparkleAttrs.offsets, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(sparkleAttrs.speeds, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sparkleAttrs.sizes, 1));
    return g;
  }, [sparkleCount, sparkleAttrs]);

  const sparkleMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uLit: { value: 0 },
          uColor: { value: new THREE.Color(COLORS.brand300) },
          uPath: { value: pathSamples },
        },
        vertexShader: sparkleVertex,
        fragmentShader: sparkleFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [pathSamples],
  );

  // Champagne arrival blink — small sphere at endpoint, opacity-pulses 50ms.
  const blinkRef = useRef<THREE.Mesh>(null);
  const blinkMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const headPosition = useMemo(() => {
    const p = curve.getPoint(0.97);
    return [p.x, p.y, p.z] as const;
  }, [curve]);

  useFrame(({ clock }) => {
    const t = loopSeconds(clock.elapsedTime);
    const lit = arrowLitMix(t, igniteKey);
    const pulseT = arrowPulsePosition(t, igniteKey);
    const fullAliveT = fullAlivePulsePosition(t, arrowIndex);
    const activeT = pulseT ?? fullAliveT;

    ribbonMaterial.uniforms.uTime.value = clock.elapsedTime;
    ribbonMaterial.uniforms.uLit.value = lit;
    ribbonMaterial.uniforms.uPulse.value = activeT ?? 0;
    ribbonMaterial.uniforms.uPulseActive.value = activeT === null ? 0 : 1;

    sparkleMaterial.uniforms.uTime.value = clock.elapsedTime;
    sparkleMaterial.uniforms.uLit.value = lit;

    if (blinkRef.current && blinkMatRef.current) {
      const blink = arrowArrivalBlink(t, igniteKey);
      blinkMatRef.current.opacity = blink;
      blinkRef.current.scale.setScalar(0.5 + blink * 0.8);
    }
  });

  return (
    <group>
      {/* Painterly ribbon */}
      <mesh geometry={ribbonGeometry} material={ribbonMaterial} />
      {/* Sparkle particle stream */}
      <points geometry={sparkleGeometry} material={sparkleMaterial} />
      {/* Champagne arrival blink */}
      <mesh ref={blinkRef} position={headPosition}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial
          ref={blinkMatRef}
          color={COLORS.champagne200}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
