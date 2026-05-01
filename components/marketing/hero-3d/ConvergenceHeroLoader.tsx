"use client";

import dynamic from "next/dynamic";
import { StaticFallback } from "./StaticFallback";

const ConvergenceHero = dynamic(() => import("./ConvergenceHero"), {
  ssr: false,
  loading: () => <StaticFallback />,
});

export function ConvergenceHeroLoader() {
  return <ConvergenceHero />;
}
