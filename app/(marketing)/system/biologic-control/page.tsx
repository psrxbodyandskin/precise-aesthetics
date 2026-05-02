import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, HeartPulse, RotateCw } from "lucide-react";
import { Section } from "@/components/marketing/Section";
import { BoneBlooms } from "@/components/marketing/BoneBlooms";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Button } from "@/components/ui/button";
import { PillarHero } from "@/components/marketing/system/PillarHero";
import { PullQuoteSection } from "@/components/marketing/system/PullQuoteSection";
import { DropCapParagraph } from "@/components/marketing/system/DropCapParagraph";
import { PivotLine } from "@/components/marketing/system/PivotLine";
import { StructuredGrid, type CardItem } from "@/components/marketing/system/StructuredGrid";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Biologic Control — The Precise System",
  description:
    "Prep, recovery, and maintenance kits — engineered as clinical components, not retail skincare. Healing is part of the protocol.",
  alternates: { canonical: `${SITE.url}/system/biologic-control` },
  openGraph: {
    title: "Biologic Control — The Precise System",
    description: "Prep, recovery, and maintenance kits engineered as clinical components.",
    url: `${SITE.url}/system/biologic-control`,
    siteName: SITE.name,
    type: "website",
  },
};

// [DRAFT — formulator/clinical review required] Page content drafted by build.

const STAGES: CardItem[] = [
  {
    icon: ShieldCheck,
    eyebrow: "Prep",
    heading: <>Prep</>,
    body: (
      <>
        Skin preparation in the days before treatment. Hydration, barrier
        reinforcement, and pigment stabilization to reduce treatment-day
        complication risk.
      </>
    ),
    items: [
      "Barrier-supporting cleanser",
      "Hydrating serum",
      "Pigment-stabilizing complex",
      "Broad-spectrum mineral SPF",
    ],
    fig: "Fig. 03A",
  },
  {
    icon: HeartPulse,
    eyebrow: "Recovery",
    heading: <>Recovery</>,
    body: (
      <>
        Post-treatment regimen calibrated to the specific protocol.
        Inflammation control, barrier repair, and pigment stabilization in
        the critical 72 hours after treatment.
      </>
    ),
    items: [
      "Anti-inflammatory recovery balm",
      "Barrier-repair serum",
      "Cooling hydration mist",
      "Post-treatment SPF protocol",
    ],
    fig: "Fig. 03B",
  },
  {
    icon: RotateCw,
    eyebrow: "Maintenance",
    heading: <>Maintenance</>,
    body: (
      <>
        Ongoing skin support between sessions and after the treatment series
        completes. Maintains pigment uniformity and prepares skin for future
        sessions.
      </>
    ),
    items: [
      "Daily barrier-support routine",
      "Pigment-uniformity serum",
      "Long-wear retinoid (protocol-specific)",
      "Year-round mineral SPF",
    ],
    fig: "Fig. 03C",
  },
];

export default function BiologicControlPage() {
  return (
    <>
      <PillarHero
        pillar="biologic"
        pillarLabel="The third pillar"
        headingLine1={<>Biologic Control.</>}
        headingLine2={<>Healing is part of the protocol.</>}
        lead={
          <>
            Most laser systems treat what happens between sessions as the
            patient&rsquo;s problem. The Precise System treats it as part of
            the architecture. Prep, recovery, and maintenance kits are
            engineered as clinical components &mdash; not retail skincare.
          </>
        }
        figNumber="01"
      />

      {/* — SECTION 2: Why healing is engineering — */}
      <PullQuoteSection
        figNumber="02"
        pullQuote={<>A protocol without biologic control is a plan without a patient.</>}
        bloomVariant="thesis"
      >
        {/* [DRAFT — pending approval] */}
        <DropCapParagraph>
          The biology between sessions matters as much as the energy
          delivered during them. Post-inflammatory hyperpigmentation,
          delayed healing, paradoxical pigment shifts, complications that
          surface days or weeks after treatment &mdash; these are largely
          functions of skin state, not laser parameters.
        </DropCapParagraph>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          Skin that arrives stressed, dehydrated, sun-damaged, or
          inflammatorily primed responds differently to identical
          parameters than skin that arrives stabilized. Skin that recovers
          inside an engineered regimen heals differently than skin left to
          recover on whatever the patient happens to have on the bathroom
          shelf.
        </p>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          Engineered biologic control turns recovery into a clinical input,
          not an afterthought. Practitioners are not selling skincare. They
          are administering a regimen that makes the protocol perform as
          designed.
        </p>
      </PullQuoteSection>

      {/* — SECTION 3: Three-stage system — */}
      <Section
        tone="bone"
        size="default"
        className="relative isolate overflow-hidden"
      >
        <BoneBlooms variant="outcomes" />

        <div className="relative max-w-[58ch]">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-500"
            />
            <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-700">
              § Fig. 03
            </p>
          </div>
          <DisplayHeading level="md" as="h2" className="mt-8 max-w-[20ch]">
            Three stages. One coordinated regimen.
          </DisplayHeading>
          <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-ink-700">
            Prep, recovery, and maintenance are not separable products.
            They are stages of a single regimen, coordinated to the
            protocol the practitioner is running. Removing any stage breaks
            the chain.
          </p>
        </div>

        <div className="relative mt-16">
          <StructuredGrid variant="cards" items={STAGES} columns={3} />
        </div>

        {/* Trust microcopy */}
        <p className="relative mt-12 font-body text-caption text-ink-500 max-w-[58ch] text-center mx-auto">
          {/* [DRAFT — formulator review required] */}
          Kit contents above are representative. Specific formulations and
          inclusions are calibrated per protocol and updated as the library
          evolves.
        </p>
      </Section>

      {/* — SECTION 4: Engineered for Fitzpatrick I–VI — */}
      <Section
        tone="midnight-deep"
        size="default"
        className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_55%_70%_at_50%_45%,_#1F2F4F_0%,_#0C1426_72%)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
            backgroundSize: "160px 160px",
          }}
        />

        <div className="relative max-w-[58ch]">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-300/60"
            />
            <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-300">
              § Fig. 04
            </p>
          </div>
          <PivotLine tone="dark" size="lg" className="mt-8 max-w-[28ch]">
            The skin types the industry treated as edge cases were the cases
            we engineered for first.
          </PivotLine>
          {/* [DRAFT — formulator/clinical review required] */}
          <p className="mt-10 font-body text-body leading-body max-w-[58ch] text-cream-100">
            Most laser-paired skincare on the market was formulated against
            a Fitzpatrick I–II baseline and adjusted for darker skin types
            as a downstream concern. The result is regimens that perform
            well on the patients they were designed for and unpredictably on
            everyone else.
          </p>
          <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-cream-100">
            The Precise biologic control kits were formulated specifically
            for Fitzpatrick I&ndash;VI tolerance from the first patch test.
            Active concentrations, pH ranges, and inactive ingredient
            selection were calibrated against the full skin-type spectrum
            &mdash; not adapted from a lighter-skin baseline.
          </p>
          <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-cream-100">
            The result is regimens whose performance does not degrade as
            Fitzpatrick increases. Same kit. Same expected response.
            Calibrated for the patients the industry has historically had
            the hardest time serving.
          </p>
        </div>
      </Section>

      {/* — SECTION 5: Closing CTA — */}
      <Section
        tone="bone"
        size="default"
        className="relative isolate overflow-hidden"
      >
        <BoneBlooms variant="lead" />

        <div className="relative flex flex-col items-center text-center">
          <DisplayHeading level="md" as="h2" className="max-w-[20ch]">
            See the regimen in context.
          </DisplayHeading>
          <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-ink-700">
            Biologic control is engineered into every protocol in the
            Precise System library. A demonstration walks through how the
            kits coordinate with the protocols and the device.
          </p>
          <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
            <Button asChild variant="primary" size="lg">
              <Link href="/demo">Request a demonstration</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/system/data-intelligence">
                Inside the data layer
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
