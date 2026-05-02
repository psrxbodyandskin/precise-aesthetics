"use client";

import dynamic from "next/dynamic";
import type { PillarKey } from "./SinglePillarScene";

const SinglePillarScene = dynamic(() => import("./SinglePillarScene"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-midnight-700" aria-hidden="true" />
  ),
});

export function SinglePillarLoader({ pillar }: { pillar: PillarKey }) {
  return <SinglePillarScene pillar={pillar} />;
}
