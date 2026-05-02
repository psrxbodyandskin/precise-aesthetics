import { Section } from "@/components/marketing/Section";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Lead } from "@/components/marketing/typography/Lead";
import { SinglePillarLoader } from "@/components/marketing/sections/SinglePillarLoader";
import type { PillarKey } from "@/components/marketing/sections/SinglePillarScene";
import { HERO_CAMERA_PRESETS } from "./heroCameraPresets";

interface PillarHeroProps {
  /** Eyebrow label (e.g., "THE FIRST PILLAR"). Rendered with § prefix automatically. */
  pillarLabel: string;
  /** First line of the heading (e.g., "Protocols."). Rendered upright. */
  headingLine1: React.ReactNode;
  /** Second line of the heading (e.g., "The medicine, not just the laser."). Rendered italic. */
  headingLine2: React.ReactNode;
  /** Lead paragraph below the heading. */
  lead: React.ReactNode;
  /** Optional figure number for top-right annotation (e.g., "01"). */
  figNumber?: string;
  /** Pillar key. When provided, the hero renders a 2-up layout with the
   *  pillar's 3D scene on the right (using the per-pillar camera preset
   *  defined in heroCameraPresets.ts). When omitted, falls back to the
   *  text-only single-column hero. */
  pillar?: PillarKey;
}

// Dark midnight-deep hero pattern shared by every pillar page (/system/protocols,
// /system/delivery, /system/biologic-control, /system/data-intelligence).
// Two-line display heading: line 1 upright, line 2 italic — mirrors the
// "Protocols. / The medicine, not just the laser." convention.
//
// When `pillar` is provided, the hero renders text-left + 3D-right. Each
// pillar uses a unique camera preset (HERO_CAMERA_PRESETS) so the four
// pillar pages have distinctly different visual character — close oblique
// for Protocols, eye-level for Delivery, low-angle for Biologic, bird's-eye
// for Data.
//
// The /system manifesto page uses its own custom hero (centered, no Fig.) because
// its scale and tone are different — that's intentional, not a missing reuse.
export function PillarHero({
  pillarLabel,
  headingLine1,
  headingLine2,
  lead,
  figNumber,
  pillar,
}: PillarHeroProps) {
  return (
    <Section
      tone="midnight-deep"
      size="hero"
      className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_55%_70%_at_50%_45%,_#1F2F4F_0%,_#0C1426_72%)]"
    >
      {/* Film-grain overlay — atmospheric continuity with the homepage hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          backgroundSize: "160px 160px",
        }}
      />

      {/* 2-up layout when a pillar is provided; single-column otherwise. */}
      {pillar ? (
        <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 lg:items-center">
          {/* Left col — text */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="block h-px w-[60px] bg-brand-300/60"
              />
              <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-300">
                § {pillarLabel}
              </p>
            </div>

            <DisplayHeading
              level="lg"
              as="h1"
              className="mt-8 max-w-[18ch] text-cream-50"
            >
              {headingLine1}
              <br />
              <span className="italic">{headingLine2}</span>
            </DisplayHeading>

            <Lead className="mt-8 text-cream-100">{lead}</Lead>
          </div>

          {/* Right col — 3D scene with bracket framing */}
          <div className="lg:col-span-5">
            <div className="relative aspect-square w-full max-w-[460px] mx-auto">
              {/* Asymmetric corner brackets — Fig. exhibit motif */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 -left-2 z-10 h-3 w-px bg-brand-300/40"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 -left-2 z-10 h-px w-3 bg-brand-300/40"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 -right-2 z-10 h-3 w-px bg-brand-300/40"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 -right-2 z-10 h-px w-3 bg-brand-300/40"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-2 -left-2 z-10 h-3 w-px bg-brand-300/40"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-2 -left-2 z-10 h-px w-3 bg-brand-300/40"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-2 -right-2 z-10 h-3 w-px bg-brand-300/40"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-2 -right-2 z-10 h-px w-3 bg-brand-300/40"
              />

              <SinglePillarLoader
                pillar={pillar}
                cameraPreset={HERO_CAMERA_PRESETS[pillar]}
              />
            </div>

            {/* Fig. annotation under the scene */}
            {figNumber && (
              <div className="mt-6 flex items-baseline justify-between gap-4 px-1 max-w-[460px] mx-auto">
                <span className="font-body text-overline tracking-overline uppercase text-brand-300/80">
                  Fig. {figNumber}
                </span>
                <span className="font-body text-caption italic text-cream-300/70 capitalize">
                  {pillar === "data" ? "Data Intelligence" : pillar === "biologic" ? "Biologic Control" : pillar}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="relative max-w-[58ch]">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="block h-px w-[60px] bg-brand-300/60"
              />
              <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-300">
                § {pillarLabel}
              </p>
            </div>

            <DisplayHeading level="lg" as="h1" className="mt-8 max-w-[20ch] text-cream-50">
              {headingLine1}
              <br />
              <span className="italic">{headingLine2}</span>
            </DisplayHeading>

            <Lead className="mt-8 text-cream-100">{lead}</Lead>
          </div>

          {/* Top-right Fig. annotation — fallback for text-only hero */}
          {figNumber && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-6 top-32 hidden md:block md:right-10 lg:right-12"
            >
              <span className="font-body text-overline tracking-overline uppercase text-brand-300/70">
                Fig. {figNumber}
              </span>
            </div>
          )}
        </>
      )}
    </Section>
  );
}
