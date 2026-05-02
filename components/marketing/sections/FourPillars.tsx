import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Section } from "@/components/marketing/Section";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Lead } from "@/components/marketing/typography/Lead";
import { TrademarkSymbol } from "@/components/marketing/typography/TrademarkSymbol";
import { SinglePillarLoader } from "@/components/marketing/sections/SinglePillarLoader";
import type { PillarKey } from "@/components/marketing/sections/SinglePillarScene";
import { cn } from "@/lib/utils";

type Pillar = {
  key: PillarKey;
  number: string;
  fig: string;
  name: string;
  tagline: string;
  description: React.ReactNode;
  features: string[];
  link: { label: string; href: string };
};

// [DRAFT — pending approval] Pillar copy from spec; clinical sign-off needed
// before final ship.
const PILLARS: Pillar[] = [
  {
    key: "protocols",
    number: "01",
    fig: "Fig. 02",
    name: "Protocols",
    tagline: "The medicine, not just the laser.",
    description: (
      <>
        The protocol library is the proprietary clinical IP that sits at the
        heart of the system. Indication-specific frameworks, including the PIH
        Prevention Protocol<TrademarkSymbol /> &mdash; engineered for safety on
        Fitzpatrick I&ndash;VI from the first pulse.
      </>
    ),
    features: [
      "Indication-specific clinical frameworks",
      "PIH Prevention Protocol™ for darker skin types",
      "Continuously refined through real-world treatment data",
    ],
    link: { label: "See the protocol library", href: "/protocols" },
  },
  {
    key: "delivery",
    number: "02",
    fig: "Fig. 03",
    name: "Delivery Mechanism",
    tagline: "Engineered to execute the protocol.",
    description: (
      <>
        The device is the instrument. Multi-wavelength pico delivery engineered
        to execute the protocol with precision. Hardware exists to serve the
        protocol &mdash; not the other way around.
      </>
    ),
    features: [
      "Four wavelengths — 532nm, 1064nm, 755nm, 785nm",
      "Sub-nanosecond pulse precision",
      "Engineered to clinical specifications, not consumer preferences",
    ],
    link: { label: "Meet Precise Pico™", href: "/pico" },
  },
  {
    key: "biologic",
    number: "03",
    fig: "Fig. 04",
    name: "Biologic Control",
    tagline: "Healing is part of the protocol.",
    description: (
      <>
        Prep, recovery, and maintenance kits engineered to optimize healing,
        reduce complication risk, and stabilize outcomes across skin types.
        Biologic control isn&rsquo;t an upsell &mdash; it&rsquo;s a pillar.
      </>
    ),
    features: [
      "Prep — skin priming before treatment",
      "Recovery — post-treatment healing support",
      "Maintenance — ongoing skin stabilization",
    ],
    link: { label: "Inside Biologic Control", href: "/system/biologic-control" },
  },
  {
    key: "data",
    number: "04",
    fig: "Fig. 05",
    name: "Data Intelligence Layer",
    tagline: "Every session makes the system smarter.",
    description: (
      <>
        Real-world treatment outcomes feed back into protocol refinement
        through the Data Intelligence Layer. Practitioners log outcomes, the
        system learns. Every cycle gets sharper.
      </>
    ),
    features: [
      "De-identified outcome tracking",
      "Aggregate pattern detection",
      "Protocol updates informed by real outcomes",
    ],
    link: {
      label: "Inside the Data Intelligence Layer",
      href: "/system/data-intelligence",
    },
  },
];

// Editorial 3D pillar exhibit — single-pillar Three.js scene with the same
// asymmetric corner-bracket framing motif as the hero "Fig. 01" exhibit.
function PillarVisual({
  pillar,
  fig,
  name,
}: {
  pillar: PillarKey;
  fig: string;
  name: string;
}) {
  return (
    <div className="relative w-full">
      {/* Asymmetric framing wrapper — corner brackets in brand-300 hairlines.
          Tighter than the hero (max 440px vs hero's 620px) for a more focused,
          plate-style feel that contrasts with the hero's gallery-exhibit framing. */}
      <div className="relative aspect-square w-full max-w-[440px] mx-auto">
        {/* Top-left small bracket */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 -left-2 z-10 h-3 w-px bg-brand-300/30"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 -left-2 z-10 h-px w-3 bg-brand-300/30"
        />
        {/* Top-right small bracket */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 -right-2 z-10 h-3 w-px bg-brand-300/30"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 -right-2 z-10 h-px w-3 bg-brand-300/30"
        />
        {/* Bottom-left small bracket */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-2 -left-2 z-10 h-3 w-px bg-brand-300/30"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-2 -left-2 z-10 h-px w-3 bg-brand-300/30"
        />
        {/* Bottom-right small bracket */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-2 -right-2 z-10 h-3 w-px bg-brand-300/30"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-2 -right-2 z-10 h-px w-3 bg-brand-300/30"
        />

        {/* The 3D scene fills the square */}
        <SinglePillarLoader pillar={pillar} />
      </div>

      {/* Editorial figure caption — matches hero "Fig. 01" motif */}
      <div className="mt-6 flex items-baseline justify-between gap-4 px-1">
        <span className="font-body text-overline tracking-overline uppercase text-brand-300/80">
          {fig}
        </span>
        <span className="font-body text-caption italic text-cream-300/70">
          {name}
        </span>
      </div>
    </div>
  );
}

function PillarBlock({
  pillar,
  reversed,
  total,
  index,
}: {
  pillar: Pillar;
  reversed: boolean;
  total: number;
  index: number;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
      <div
        className={cn(
          "lg:col-span-6",
          reversed ? "lg:order-2" : "lg:order-1",
        )}
      >
        {/* Meta line — pillar position within the system */}
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="block h-px w-8 bg-brand-300/40"
          />
          <span className="font-body text-overline tracking-overline uppercase text-brand-300/80">
            Pillar {pillar.number} / {String(total).padStart(2, "0")}
          </span>
        </div>

        {/* Oversized italic plate number — editorial drama */}
        <p
          className="mt-4 font-display text-[clamp(4rem,7vw+1rem,7.5rem)] italic leading-none text-brand-300/25 select-none"
          aria-hidden="true"
        >
          {pillar.number}
        </p>
        <h3 className="mt-2 font-display tracking-heading leading-heading text-[clamp(1.75rem,1.5vw+1rem,2.25rem)] text-cream-50">
          {pillar.name}
        </h3>
        <p className="mt-3 font-display text-h3 italic text-brand-300/90">
          {pillar.tagline}
        </p>
        <p className="mt-6 font-body text-body leading-body max-w-[52ch] text-cream-100">
          {pillar.description}
        </p>
        <ul className="mt-8 space-y-3" role="list">
          {pillar.features.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <CheckCircle2
                className="mt-[3px] size-5 shrink-0 text-brand-300"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className="font-body text-small text-cream-100">{f}</span>
            </li>
          ))}
        </ul>
        <Link
          href={pillar.link.href}
          className={cn(
            "mt-10 inline-flex items-center gap-2",
            "font-body text-small text-brand-300 hover:text-brand-200",
            "transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm",
          )}
        >
          <span>{pillar.link.label}</span>
          <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>
      <div
        className={cn(
          "lg:col-span-6",
          reversed ? "lg:order-1" : "lg:order-2",
        )}
      >
        <PillarVisual pillar={pillar.key} fig={pillar.fig} name={pillar.name} />
      </div>
    </div>
  );
}

export function FourPillars() {
  return (
    <Section
      tone="midnight-deep"
      size="default"
      className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_60%_70%_at_50%_30%,_#1F2F4F_0%,_#0C1426_72%)]"
    >
      {/* Film-grain noise overlay — atmospheric continuity with the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          backgroundSize: "160px 160px",
        }}
      />

      <div className="relative">
        {/* Editorial section header */}
        <div className="max-w-[58ch]">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-300/60"
            />
            <span className="font-body text-overline tracking-overline font-medium uppercase text-brand-300">
              § The Precise System<TrademarkSymbol />
            </span>
          </div>
          <DisplayHeading
            level="lg"
            as="h2"
            className="mt-8 max-w-[18ch] text-cream-50"
          >
            Four pillars. One closed loop.
          </DisplayHeading>
          <Lead className="mt-8 text-cream-100">
            A laser alone produces inconsistent results. A protocol without
            biologic control produces complications. A device without outcome
            data can&rsquo;t improve. The Precise System closes the loop &mdash;
            device, protocol, biologic control, and data &mdash; so every
            session refines the next.
          </Lead>
        </div>

        <div className="mt-20 md:mt-28 space-y-24 md:space-y-32">
          {PILLARS.map((pillar, i) => (
            <div key={pillar.number}>
              <PillarBlock
                pillar={pillar}
                reversed={i % 2 === 1}
                total={PILLARS.length}
                index={i}
              />
              {i < PILLARS.length - 1 && (
                <div className="mt-24 md:mt-32 flex items-center justify-center gap-6">
                  <span
                    aria-hidden="true"
                    className="block h-px w-[80px] bg-brand-300/25"
                  />
                  <span
                    aria-hidden="true"
                    className="font-body text-[10px] tracking-[0.32em] uppercase text-cream-300/40"
                  >
                    &middot;
                  </span>
                  <span
                    aria-hidden="true"
                    className="block h-px w-[80px] bg-brand-300/25"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
