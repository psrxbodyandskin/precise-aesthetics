import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/marketing/Section";
import { BoneBlooms } from "@/components/marketing/BoneBlooms";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { TrademarkSymbol } from "@/components/marketing/typography/TrademarkSymbol";
import { Button } from "@/components/ui/button";
import { PillarHero } from "@/components/marketing/system/PillarHero";
import { PullQuoteSection } from "@/components/marketing/system/PullQuoteSection";
import { DropCapParagraph } from "@/components/marketing/system/DropCapParagraph";
import { StructuredGrid, type NumberedItem } from "@/components/marketing/system/StructuredGrid";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Delivery — The Precise System",
  description:
    "The delivery mechanism is the instrument that executes the protocol. Hardware exists to serve the protocol — not to define what's possible.",
  alternates: { canonical: `${SITE.url}/system/delivery` },
  openGraph: {
    title: "Delivery — The Precise System",
    description: "The instrument that executes the protocol.",
    url: `${SITE.url}/system/delivery`,
    siteName: SITE.name,
    type: "website",
  },
};

// [DRAFT — pending approval] Page content drafted by build, not from a
// locked source. Voice matches the manifesto register.

const ENGINEERING_REQUIREMENTS: NumberedItem[] = [
  {
    number: "01",
    heading: "Multi-wavelength capability",
    body: "To address pigmented, tattooed, dyschromic, and textural targets — different wavelengths penetrate different chromophores. A single-wavelength device is a single-protocol device.",
  },
  {
    number: "02",
    heading: "Sub-nanosecond pulse precision",
    body: "Picosecond delivery disrupts pigment via photoacoustic effect rather than thermal damage. The narrower the pulse, the cleaner the disruption — and the lower the inflammatory load on darker skin types.",
  },
  {
    number: "03",
    heading: "Wavelength-specific energy parameters",
    body: "Calibrated to the protocol library. The device exposes the parameter ranges each protocol requires; ranges outside protocol envelopes are not available without explicit override.",
  },
  {
    number: "04",
    heading: "Repeatability across treatments",
    body: "Same parameters, same outcome. The device must hold calibration precisely across a multi-session treatment series — drift between sessions invalidates the protocol.",
  },
  {
    number: "05",
    heading: "Practitioner workflow integration",
    body: "Minimal cognitive load during treatment. Protocol-driven UI surfaces only the parameters relevant to the indication being treated. Practitioner attention belongs on the patient, not the device.",
  },
];

export default function DeliveryPage() {
  return (
    <>
      <PillarHero
        pillar="delivery"
        pillarLabel="The second pillar"
        headingLine1={<>Delivery.</>}
        headingLine2={<>The instrument, not the system.</>}
        lead={
          <>
            The device is the part of the system most companies sell first. We
            design it last. The delivery mechanism exists to execute the
            protocol with precision &mdash; not to define what&rsquo;s
            possible.
          </>
        }
        figNumber="01"
      />

      {/* — SECTION 2: Inversion of the industry — */}
      <PullQuoteSection
        figNumber="02"
        pullQuote={
          <>Hardware exists to serve the protocol &mdash; not the other way around.</>
        }
        bloomVariant="thesis"
      >
        {/* [DRAFT — pending approval] */}
        <DropCapParagraph>
          The standard order of operations in laser dermatology runs
          backward. Engineering teams design what they can build. Marketing
          teams write the indications afterward. Clinical protocols arrive
          last &mdash; assembled from whatever the hardware happens to be
          capable of. The patient experience is downstream of every other
          decision.
        </DropCapParagraph>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          The Precise System inverts that order. Clinical outcomes are
          defined first: who are we treating, what indications, on which
          skin types, with what acceptable complication profile? Protocols
          are authored to those outcomes. Biologic control is engineered to
          support the protocols. Only then is the device specified &mdash;
          to the parameter envelopes the protocols require.
        </p>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          The result is a device whose feature set is determined by
          clinical necessity, not engineering ambition. There are
          capabilities the device deliberately omits because no protocol in
          the library calls for them. There are capabilities included only
          because a protocol requires them. The hardware serves the
          medicine.
        </p>
      </PullQuoteSection>

      {/* — SECTION 3: Engineering requirements — */}
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
          <DisplayHeading level="md" as="h2" className="mt-8 max-w-[18ch]">
            The engineering requirements.
          </DisplayHeading>
          <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-ink-700">
            Five architectural requirements emerged from the protocol
            library. Each has a clinical reason. None is included for its
            own sake.
          </p>
        </div>

        <div className="relative mt-16 max-w-[58ch]">
          <StructuredGrid variant="numbered" items={ENGINEERING_REQUIREMENTS} />
        </div>
      </Section>

      {/* — SECTION 4: The current device — */}
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
              § The current instrument
            </p>
          </div>
          <DisplayHeading
            level="md"
            as="h2"
            className="mt-8 max-w-[16ch] text-cream-50"
          >
            Precise Pico<TrademarkSymbol />.
          </DisplayHeading>
          <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-cream-100">
            The current device executing the Delivery pillar is Precise
            Pico<TrademarkSymbol /> &mdash; a four-wavelength pico laser
            engineered to the architectural requirements above. Future
            devices in the Precise System line will extend the Delivery
            pillar into adjacent treatment categories. The architecture
            stays. The instrument evolves.
          </p>
          <Link
            href="/pico"
            className={cn(
              "mt-10 inline-flex items-center gap-2",
              "font-body text-small text-brand-300 hover:text-brand-200",
              "transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm",
            )}
          >
            <span>
              Meet Precise Pico<TrademarkSymbol />
            </span>
            <ArrowRight
              className="size-4"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </Link>
        </div>
      </Section>

      {/* — SECTION 5: Why a device alone fails — */}
      <PullQuoteSection
        figNumber="04"
        pullQuote={<>A device without protocols is a tool without instructions.</>}
        flip
        bloomVariant="lead"
      >
        {/* [DRAFT — pending approval] */}
        <DropCapParagraph>
          Two practitioners can use the same laser at the same parameters on
          patients with the same indication and produce different outcomes.
          This is not a hardware problem. It is the absence of a system
          around the hardware.
        </DropCapParagraph>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          Patient assessment differs. Pre-treatment skin condition differs.
          Post-treatment care differs. The framework around the energy
          delivery is what determines whether the energy delivers a clinical
          outcome &mdash; or a complication. A great laser without a great
          protocol is a great tool that can still produce inconsistent
          results.
        </p>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          The Precise System closes that gap. The device does what the
          protocol requires. The biologic control supports what the
          protocol requires. The data layer captures whether the protocol
          delivered. The device is one component in a system designed to
          produce reliable outcomes &mdash; not the system itself.
        </p>
      </PullQuoteSection>

      {/* — SECTION 6: Closing CTA — */}
      <Section
        tone="midnight-deep"
        size="default"
        className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_55%_70%_at_50%_50%,_#1F2F4F_0%,_#0C1426_72%)]"
      >
        <div className="flex flex-col items-center text-center">
          <DisplayHeading
            level="md"
            as="h2"
            className="max-w-[18ch] text-cream-50"
          >
            See the system in motion.
          </DisplayHeading>
          <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
            <Button asChild variant="primary-on-dark" size="lg">
              <Link href="/demo">Request a demonstration</Link>
            </Button>
            <Button asChild variant="secondary-on-dark" size="lg">
              <Link href="/pico">
                See Precise Pico<TrademarkSymbol />
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
