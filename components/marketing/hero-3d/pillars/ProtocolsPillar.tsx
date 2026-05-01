"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  COLORS,
  EMISSIVE_AMBIENT,
  EMISSIVE_IGNITED,
  IDLE_ROTATION_SECONDS,
} from "../constants";
import { createProtocolsPanelMaterial } from "../materials";
import { idleYRotation, loopSeconds, pillarLitMix } from "../motion";

type Props = { simplified?: boolean };

const PANEL_W = 0.9;
const PANEL_H = 0.7;
const PANEL_ARC_DEG = 30;

// Bend a flat plane into a 30° arc along X by mapping x → angle.
function buildCurvedPanelGeometry(
  width: number,
  height: number,
  arcDeg: number,
): THREE.BufferGeometry {
  const widthSegments = 24;
  const heightSegments = 1;
  const geom = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
  const positions = geom.attributes.position;
  const arcRad = (arcDeg * Math.PI) / 180;
  const radius = width / (2 * Math.sin(arcRad / 2));
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const angle = (x / (width / 2)) * (arcRad / 2);
    positions.setX(i, Math.sin(angle) * radius);
    positions.setZ(i, radius - Math.cos(angle) * radius);
  }
  positions.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

// Sample a curve point on the same arc as the panel.
// xRel is in [-0.5, 0.5] (fraction across panel width).
function curvePoint(xRel: number, y: number): [number, number, number] {
  const arcRad = (PANEL_ARC_DEG * Math.PI) / 180;
  const radius = PANEL_W / (2 * Math.sin(arcRad / 2));
  const x = xRel * PANEL_W;
  const angle = (x / (PANEL_W / 2)) * (arcRad / 2);
  // Tiny Z-bias forward so overlay sits in front of the glass surface.
  const zBias = 0.003;
  return [
    Math.sin(angle) * radius,
    y,
    radius - Math.cos(angle) * radius + zBias,
  ];
}

// A "text row" is one or more line segments at a given y, optionally with a gap.
type Row = { y: number; xStart: number; xEnd: number };
type DiagramBlock = { x: number; y: number; w: number; h: number };

// Produce a single BufferGeometry containing all rows + diagram block edges,
// with vertex pairs forming line segments.
function buildOverlayGeometry(rows: Row[], block: DiagramBlock): THREE.BufferGeometry {
  const positions: number[] = [];
  // Rows — sampled along arc, tessellated into N small segments per row.
  const segPerRow = 16;
  for (const row of rows) {
    for (let i = 0; i < segPerRow; i++) {
      const t0 = i / segPerRow;
      const t1 = (i + 1) / segPerRow;
      const xa = row.xStart + (row.xEnd - row.xStart) * t0;
      const xb = row.xStart + (row.xEnd - row.xStart) * t1;
      const a = curvePoint(xa, row.y);
      const b = curvePoint(xb, row.y);
      positions.push(...a, ...b);
    }
  }
  // Diagram block — outline rectangle (4 segments). Sampled along arc as well.
  const { x, y, w, h } = block;
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const y0 = y - h / 2;
  const y1 = y + h / 2;
  const corners: [number, number][] = [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = corners[i];
    const [bx, by] = corners[(i + 1) % 4];
    // Tessellate horizontal edges so they ride the curve; vertical edges short.
    const isHorizontal = Math.abs(ay - by) < 1e-6;
    const segs = isHorizontal ? 8 : 1;
    for (let j = 0; j < segs; j++) {
      const t0 = j / segs;
      const t1 = (j + 1) / segs;
      const a = curvePoint(ax + (bx - ax) * t0, ay + (by - ay) * t0);
      const b = curvePoint(ax + (bx - ax) * t1, ay + (by - ay) * t1);
      positions.push(...a, ...b);
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geom;
}

// Distinct row+diagram patterns per panel — three "different pages."
const PANEL_OVERLAYS: { rows: Row[]; block: DiagramBlock }[] = [
  // Panel 1 — five rows, diagram block top-right
  {
    rows: [
      { y: 0.16, xStart: -0.42, xEnd: 0.10 },
      { y: 0.06, xStart: -0.42, xEnd: 0.32 },
      { y: -0.04, xStart: -0.42, xEnd: 0.28 },
      { y: -0.14, xStart: -0.42, xEnd: 0.20 },
      { y: -0.24, xStart: -0.42, xEnd: 0.34 },
    ],
    block: { x: 0.26, y: 0.24, w: 0.18, h: 0.10 },
  },
  // Panel 2 — four longer rows, diagram block top-left
  {
    rows: [
      { y: 0.18, xStart: 0.05, xEnd: 0.42 },
      { y: 0.04, xStart: -0.40, xEnd: 0.40 },
      { y: -0.10, xStart: -0.40, xEnd: 0.32 },
      { y: -0.24, xStart: -0.40, xEnd: 0.28 },
    ],
    block: { x: -0.28, y: 0.22, w: 0.20, h: 0.10 },
  },
  // Panel 3 — six denser rows, diagram block top-center
  {
    rows: [
      { y: 0.18, xStart: -0.34, xEnd: 0.06 },
      { y: 0.10, xStart: -0.40, xEnd: 0.34 },
      { y: 0.02, xStart: -0.40, xEnd: 0.30 },
      { y: -0.06, xStart: -0.40, xEnd: 0.36 },
      { y: -0.14, xStart: -0.40, xEnd: 0.22 },
      { y: -0.24, xStart: -0.40, xEnd: 0.32 },
    ],
    block: { x: 0.22, y: 0.26, w: 0.16, h: 0.08 },
  },
];

export function ProtocolsPillar({ simplified = false }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const matRefs = useRef<(THREE.MeshPhysicalMaterial | null)[]>([null, null, null]);
  const overlayMatRef = useRef<THREE.LineBasicMaterial>(null);

  const material1 = useMemo(() => createProtocolsPanelMaterial(simplified), [simplified]);
  const material2 = useMemo(() => createProtocolsPanelMaterial(simplified), [simplified]);
  const material3 = useMemo(() => createProtocolsPanelMaterial(simplified), [simplified]);

  const panelGeometry = useMemo(
    () => buildCurvedPanelGeometry(PANEL_W, PANEL_H, PANEL_ARC_DEG),
    [],
  );

  const overlayGeometries = useMemo(
    () => PANEL_OVERLAYS.map((p) => buildOverlayGeometry(p.rows, p.block)),
    [],
  );

  // Shared LineBasicMaterial for all three overlays — brand-300, low opacity.
  const overlayMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: COLORS.brand300,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
    [],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = idleYRotation(
      clock.elapsedTime,
      IDLE_ROTATION_SECONDS.protocols,
    );
    const lit = pillarLitMix(loopSeconds(clock.elapsedTime), "protocolsOn");
    const intensity = EMISSIVE_AMBIENT + lit * (EMISSIVE_IGNITED - EMISSIVE_AMBIENT);
    matRefs.current.forEach((m) => {
      if (m) m.emissiveIntensity = intensity;
    });
    // Overlay opacity rises slightly when ignited — info "comes into focus."
    if (overlayMatRef.current) {
      overlayMatRef.current.opacity = 0.4 + lit * 0.4;
    }
  });

  const panels = [
    { z: 0, rotY: 0, mat: material1 },
    { z: -0.15, rotY: 0.052, mat: material2 },
    { z: -0.3, rotY: -0.052, mat: material3 },
  ];

  return (
    <group ref={groupRef} position={[0, 0.35, 0]}>
      {panels.map((p, i) => (
        <group key={i} position={[0, 0, p.z]} rotation={[0, p.rotY, 0]}>
          {/* Panel surface */}
          <mesh geometry={panelGeometry}>
            <primitive
              object={p.mat}
              attach="material"
              ref={(ref: THREE.MeshPhysicalMaterial | null) => {
                matRefs.current[i] = ref;
              }}
            />
          </mesh>
          {/* Info-row + diagram-block overlay (line segments riding the curve) */}
          <lineSegments geometry={overlayGeometries[i]}>
            <primitive
              object={overlayMaterial}
              attach="material"
              ref={i === 0 ? overlayMatRef : undefined}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
