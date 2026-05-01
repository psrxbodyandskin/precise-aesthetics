import * as THREE from "three";
import { COLORS } from "./constants";

// Per-pillar material configs. Pass 3 = structure; material polish is Pass 4.
// All colors map to MASTER tokens via COLORS.

// Pedestal — ink-700 disc with richer clearcoat (Pass 4 tuning).
export function createPedestalMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: COLORS.ink700,
    roughness: 0.28,
    metalness: 0.08,
    clearcoat: 0.8,
    clearcoatRoughness: 0.18,
  });
}

// Pedestal rim — emissive ring around top edge, idle low / ignited bright.
export function createPedestalRimMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: COLORS.brand300,
    emissive: COLORS.brand300,
    emissiveIntensity: 0.15,
    metalness: 0.2,
    roughness: 0.5,
    transparent: true,
    opacity: 0.85,
  });
}

// Protocols panel — frosted glass on desktop, opacity-only on tablet.
export function createProtocolsPanelMaterial(
  simplified: boolean,
): THREE.MeshPhysicalMaterial {
  if (simplified) {
    return new THREE.MeshPhysicalMaterial({
      color: COLORS.brand300,
      transparent: true,
      opacity: 0.55,
      roughness: 0.25,
      metalness: 0.05,
      emissive: COLORS.brand300,
      emissiveIntensity: 0.15,
      side: THREE.DoubleSide,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: COLORS.brand300,
    transmission: 0.85,
    roughness: 0.15,
    thickness: 0.5,
    ior: 1.4,
    emissive: COLORS.brand300,
    emissiveIntensity: 0.15,
    side: THREE.DoubleSide,
  });
}

// Delivery — translucent glowing sphere (Pass 5e). Glass shell tuned so the
// PA monogram inside actually reads through. Brightens on ignite.
export function createDeliveryBodyMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: COLORS.brand300,
    emissive: COLORS.brand300,
    emissiveIntensity: 0.3,
    transmission: 0.95,
    roughness: 0.05,
    thickness: 0.1,
    ior: 1.25,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });
}

// Delivery screen — emissive face, intensity animated by phase.
export function createDeliveryScreenMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: COLORS.brand300,
    emissive: COLORS.brand300,
    emissiveIntensity: 0.4,
    metalness: 0.0,
    roughness: 0.9,
  });
}

// Data torus — translucent brand-blue with subtle emissive (Pass 5b: pulled back).
export function createDataTorusMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: COLORS.brand500,
    transmission: 0.6,
    roughness: 0.2,
    emissive: COLORS.brand300,
    emissiveIntensity: 0.6,
    thickness: 0.3,
    ior: 1.3,
  });
}

// Data inner companion torus (desktop only) — slightly larger, lower opacity.
export function createDataInnerTorusMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: COLORS.brand500,
    transmission: 0.4,
    roughness: 0.25,
    emissive: COLORS.brand300,
    emissiveIntensity: 0.4,
    thickness: 0.2,
    ior: 1.3,
    transparent: true,
    opacity: 0.6,
  });
}

// Data particles — additive-blended brand-300 glow.
export function createDataParticleMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: COLORS.brand300,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    toneMapped: false,
  });
}

// Biologic bottle — premium ceramic (Pass 4: cleaner specular highlights).
export function createBottleMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: COLORS.cream100,
    roughness: 0.22,
    metalness: 0.08,
    clearcoat: 0.9,
    clearcoatRoughness: 0.15,
  });
}

// Biologic cap — champagne metallic (Pass 4: tighter clearcoat for jewelry sheen).
export function createCapMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: COLORS.champagne200,
    metalness: 0.85,
    roughness: 0.12,
    clearcoat: 0.7,
    clearcoatRoughness: 0.1,
  });
}

// Flow arrow tube/cone — idle dim ink-700, ignites brand-300.
export function createArrowMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: COLORS.ink700,
    emissive: COLORS.brand300,
    emissiveIntensity: 0.0,
    metalness: 0.1,
    roughness: 0.6,
    transparent: true,
    opacity: 0.4,
  });
}

// Arrow traveling pulse — small bright sphere that travels along the tube.
export function createPulseMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: COLORS.brand300,
    transparent: true,
    opacity: 1,
    toneMapped: false,
  });
}

// Arrow-head champagne blink — only fires for ~50ms when pulse arrives.
export function createBlinkMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: COLORS.champagne200,
    transparent: true,
    opacity: 0,
    toneMapped: false,
  });
}
