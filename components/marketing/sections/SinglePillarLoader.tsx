"use client";

import dynamic from "next/dynamic";
import type { CameraPreset, PillarKey } from "./SinglePillarScene";

const SinglePillarScene = dynamic(() => import("./SinglePillarScene"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-midnight-700" aria-hidden="true" />
  ),
});

export function SinglePillarLoader({
  pillar,
  cameraPreset,
}: {
  pillar: PillarKey;
  cameraPreset?: CameraPreset;
}) {
  return <SinglePillarScene pillar={pillar} cameraPreset={cameraPreset} />;
}
