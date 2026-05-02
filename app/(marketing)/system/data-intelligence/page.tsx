import type { Metadata } from "next";
import Link from "next/link";
import { Activity, BarChart3, RefreshCw } from "lucide-react";
import { Section } from "@/components/marketing/Section";
import { BoneBlooms } from "@/components/marketing/BoneBlooms";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Button } from "@/components/ui/button";
import { PillarHero } from "@/components/marketing/system/PillarHero";
import { PullQuoteSection } from "@/components/marketing/system/PullQuoteSection";
import { DropCapParagraph } from "@/components/marketing/system/DropCapParagraph";
import { ArchitectureDiagram } from "@/components/marketing/system/ArchitectureDiagram";
import {
  StructuredGrid,
  type CardItem,
  type NumberedItem,
} from "@/components/marketing/system/StructuredGrid";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Data Intelligence Layer — The Precise System",
  description:
    "How the Precise System gets smarter. Real-world treatment outcomes refine the protocol library — for every practitioner using the system.",
  alternates: { canonical: `${SITE.url}/system/data-intelligence` },
  openGraph: {
    title: "Data Intelligence Layer — The Precise System",
    description: "Every cycle gets sharper.",
    url: `${SITE.url}/system/data-intelligence`,
    siteName: SITE.name,
    type: "website",
  },
};

// [DRAFT — pending approval] Page content drafted by build.
// [Roni naming intentionally anonymized per brand-no-personalities rule.
//  Override only if business strategy changes.]

const CAPTURED_INPUTS: NumberedItem[] = [
  {
    number: "01",
    heading: "Indication and Fitzpatrick type",
    body: "The clinical condition treated and the patient's Fitzpatrick classification — the two variables that together determine which protocol applies.",
  },
  {
    number: "02",
    heading: "Protocol version used",
    body: "The exact protocol version executed, captured automatically from the practitioner portal at the start of treatment.",
  },
  {
    number: "03",
    heading: "Device parameters applied",
    body: "Wavelength, fluence, pulse duration, spot size, and pulse count — the actual values delivered, not just the prescribed envelope.",
  },
  {
    number: "04",
    heading: "Biologic control regimen used",
    body: "Which prep, recovery, and maintenance kit components were used and at what intervals.",
  },
  {
    number: "05",
    heading: "Outcome at scheduled follow-ups",
    body: "Structured outcome capture at protocol-defined follow-up intervals — clearance, residual pigment, tone uniformity, scar response.",
  },
  {
    number: "06",
    heading: "Complications, if any",
    body: "Any complication observed — PIH, hypopigmentation, blistering, prolonged erythema, paradoxical response — coded against a structured taxonomy.",
  },
  {
    number: "07",
    heading: "Practitioner notes and adjustments",
    body: "Any deviation the practitioner made from the protocol envelope, with the clinical reason documented.",
  },
  {
    number: "08",
    heading: "Patient-reported outcomes",
    body: "Where the protocol calls for it — patient-reported satisfaction, comfort during and after treatment, perceived results.",
  },
];

const PRACTITIONER_OUTPUTS: CardItem[] = [
  {
    icon: RefreshCw,
    eyebrow: "Continuous updates",
    heading: <>Continuous protocol updates</>,
    body: (
      <>
        The protocol library updates based on aggregated outcomes.
        Practitioners receive new and refined protocols automatically through
        the practitioner portal.
      </>
    ),
    fig: "Fig. 04A",
  },
  {
    icon: BarChart3,
    eyebrow: "Aggregate insights",
    heading: <>Aggregate insights</>,
    body: (
      <>
        Anonymized pattern data from across the practitioner network &mdash;
        useful for clinical decision-making in the practitioner&rsquo;s own
        practice.
      </>
    ),
    fig: "Fig. 04B",
  },
  {
    icon: Activity,
    eyebrow: "Outcome benchmarks",
    heading: <>Outcome benchmarks</>,
    body: (
      <>
        Each practitioner can compare their outcomes against network
        aggregates (anonymized), surfacing opportunities for refinement.
      </>
    ),
    fig: "Fig. 04C",
  },
];

export default function DataIntelligencePage() {
  return (
    <>
      <PillarHero
        pillar="data"
        pillarLabel="The fourth pillar"
        headingLine1={<>Data Intelligence.</>}
        headingLine2={<>Every cycle gets sharper.</>}
        lead={
          <>
            The Data Intelligence Layer is what separates The Precise System
            from a piece of equipment. Every treatment a practitioner runs
            becomes input that refines the protocol library &mdash; for every
            practitioner using the system.
          </>
        }
        figNumber="01"
      />

      {/* — SECTION 2: The closed loop, explained — */}
      <PullQuoteSection
        figNumber="02"
        pullQuote={<>A device without outcome data is a machine that cannot improve.</>}
        bloomVariant="thesis"
      >
        {/* [DRAFT — pending approval] */}
        <DropCapParagraph>
          The closed loop is the mechanism most laser systems do not have.
          A device sells, a treatment is delivered, an outcome occurs &mdash;
          and the outcome stays with that one patient and that one
          practitioner. Nothing the practitioner observes finds its way back
          to the design of the device or the protocol that prescribed the
          treatment. The system, if you can call it that, does not learn.
        </DropCapParagraph>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          The Precise System closes that loop. Every treatment a practitioner
          runs is logged in the practitioner portal at the moment of
          treatment. The Data Intelligence Layer aggregates outcomes across
          the practitioner network &mdash; not at the individual patient
          level, but at the protocol level. Pattern detection runs
          continuously, surfacing parameter envelopes that drift from
          expected outcomes, biologic control combinations that improve
          recovery times, and indications where the existing protocol is
          producing inconsistent results.
        </p>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          The patterns become candidate refinements. Candidate refinements
          go to clinical leadership for review &mdash; not all signal is
          worth acting on, and not all action is safe without clinical
          context. Approved refinements are versioned into the protocol
          library and pushed to every practitioner using the system. The
          next session a practitioner runs is informed by every prior
          session across the network.
        </p>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          The longer the system runs, the more outcome-history it has, the
          more refined the protocols become. The system is not static
          equipment. It is a clinical network in continuous improvement.
        </p>
      </PullQuoteSection>

      {/* — SECTION 3: The architecture diagram (data variant) — */}
      <Section
        tone="midnight-deep"
        size="default"
        className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_60%_70%_at_50%_30%,_#1F2F4F_0%,_#0C1426_72%)]"
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
              § Fig. 03 &mdash; The data lifecycle
            </p>
          </div>
          <DisplayHeading
            level="md"
            as="h2"
            className="mt-8 max-w-[18ch] text-cream-50"
          >
            How the layer learns.
          </DisplayHeading>
          <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-cream-100">
            The same four-pillar architecture, with the arrows annotated as
            the data lifecycle. Treatment is logged. Outcomes are aggregated.
            Patterns surface. Approved updates push back to the library.
          </p>
        </div>

        <div className="relative mt-16 mx-auto max-w-[840px]">
          <ArchitectureDiagram variant="data" />
        </div>

        {/* Clinical review process — anonymized per brand-no-personalities rule */}
        <div className="relative mt-16 max-w-[58ch]">
          <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-300">
            Clinical review
          </p>
          <p className="mt-4 font-body text-body leading-body max-w-[58ch] text-cream-100">
            Pattern detection surfaces refinements. Clinical leadership
            reviews and approves protocol updates. Approved updates push as
            a new protocol version &mdash; practitioners receive update
            notifications in the portal automatically.
          </p>
        </div>
      </Section>

      {/* — SECTION 4: What data is captured — */}
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
              § Fig. 04
            </p>
          </div>
          <DisplayHeading level="md" as="h2" className="mt-8 max-w-[18ch]">
            The inputs.
          </DisplayHeading>
          <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-ink-700">
            What the practitioner logs at the time of treatment. Capture is
            structured, brief, and protocol-driven &mdash; the portal
            surfaces only the fields the protocol requires.
          </p>
        </div>

        <div className="relative mt-16 max-w-[58ch]">
          <StructuredGrid variant="numbered" items={CAPTURED_INPUTS} />
        </div>

        <p className="relative mt-12 font-body text-caption text-ink-500 max-w-[58ch]">
          All data is de-identified at the point of capture. The Data
          Intelligence Layer aggregates patterns, not patient records.
        </p>
      </Section>

      {/* — SECTION 5: What practitioners get back — */}
      <Section
        tone="midnight-deep"
        size="default"
        className="relative isolate overflow-hidden"
      >
        <div className="relative max-w-[58ch]">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-300/60"
            />
            <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-300">
              § Fig. 05
            </p>
          </div>
          <DisplayHeading
            level="md"
            as="h2"
            className="mt-8 max-w-[18ch] text-cream-50"
          >
            The outputs.
          </DisplayHeading>
          <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-cream-100">
            What flows back to the practitioner. The data layer is not a
            one-way capture &mdash; it produces tangible outputs that show
            up in the practitioner portal continuously.
          </p>
        </div>

        <div className="relative mt-16">
          <StructuredGrid
            variant="cards"
            items={PRACTITIONER_OUTPUTS}
            columns={3}
            tone="dark"
          />
        </div>
      </Section>

      {/* — SECTION 6: Privacy + ethics — */}
      <Section
        tone="bone"
        size="default"
        className="relative isolate overflow-hidden"
        containerWidth="prose"
      >
        <BoneBlooms variant="lead" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-500"
            />
            <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-700">
              § Fig. 06
            </p>
          </div>
          <DisplayHeading level="md" as="h2" className="mt-8 max-w-[20ch]">
            How we handle the data.
          </DisplayHeading>
          {/* [DRAFT — legal review required before launch] */}
          <p className="mt-8 font-body text-body leading-body text-ink-700">
            Patient identifiers never enter the Data Intelligence Layer.
            Practitioners log outcomes in their own portal; the layer
            receives de-identified aggregated patterns. Compliance with
            HIPAA and state-specific clinical data regulations is the floor,
            not the ceiling.
          </p>
          <p className="mt-6 font-body text-body leading-body text-ink-700">
            The data exists to make outcomes better &mdash; for patients,
            practitioners, and the system. It does not exist to be sold or
            shared. There is no advertising layer on top of the data. There
            is no third-party access to the aggregated outcomes. There is
            no business model in which the practitioner network becomes
            anyone&rsquo;s data product.
          </p>
          <p className="mt-6 font-body text-body leading-body text-ink-700">
            The system gets smarter only because the practitioners using it
            agree to participate in the closed loop. That participation is
            the product.
          </p>
        </div>
      </Section>

      {/* — SECTION 7: Closing CTA — */}
      <Section
        tone="midnight-deep"
        size="default"
        className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_55%_70%_at_50%_50%,_#1F2F4F_0%,_#0C1426_72%)]"
      >
        <div className="flex flex-col items-center text-center">
          <DisplayHeading
            level="md"
            as="h2"
            className="max-w-[20ch] text-cream-50"
          >
            See the system in motion.
          </DisplayHeading>
          <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
            <Button asChild variant="primary-on-dark" size="lg">
              <Link href="/demo">Request a demonstration</Link>
            </Button>
            <Button asChild variant="secondary-on-dark" size="lg">
              <Link href="/system">See the architecture</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
