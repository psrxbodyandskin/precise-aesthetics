import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/marketing/Section";
import { BoneBlooms } from "@/components/marketing/BoneBlooms";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Lead } from "@/components/marketing/typography/Lead";
import { TrademarkSymbol } from "@/components/marketing/typography/TrademarkSymbol";
import { Button } from "@/components/ui/button";
import { PullQuoteSection } from "@/components/marketing/system/PullQuoteSection";
import { DropCapParagraph } from "@/components/marketing/system/DropCapParagraph";
import { PivotLine } from "@/components/marketing/system/PivotLine";
import { ArchitectureDiagram } from "@/components/marketing/system/ArchitectureDiagram";
import { IterationRings } from "@/components/marketing/system/IterationRings";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "The Precise System — Architecture & Manifesto",
  description:
    "The architecture behind The Precise System: protocols, delivery, biologic control, and the data intelligence layer — engineered as one closed loop for predictable outcomes across Fitzpatrick I–VI.",
  alternates: { canonical: `${SITE.url}/system` },
  openGraph: {
    title: "The Precise System — Architecture & Manifesto",
    description:
      "The architecture behind The Precise System and why we built it this way.",
    url: `${SITE.url}/system`,
    siteName: SITE.name,
    type: "website",
  },
};

export default function SystemPage() {
  return (
    <>
      {/* — SECTION 1: HERO — */}
      {/* Midnight-deep, centered single column, no 3D, no CTA. The
          manifesto lets people read first, not act first. */}
      <Section
        tone="midnight-deep"
        size="hero"
        className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_55%_70%_at_50%_45%,_#1F2F4F_0%,_#0C1426_72%)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
            backgroundSize: "160px 160px",
          }}
        />

        <div className="relative flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-300/60"
            />
            <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-300">
              § The thesis
            </p>
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-300/60"
            />
          </div>

          <DisplayHeading
            level="xl"
            as="h1"
            className="mt-10 max-w-[22ch] text-cream-50"
          >
            The system is the medicine.
            <br />
            <span className="italic">The device is the instrument.</span>
          </DisplayHeading>

          <Lead className="mt-10 text-cream-100 mx-auto">
            The architecture behind The Precise System<TrademarkSymbol /> &mdash;
            and why we built it this way.
          </Lead>
        </div>

        {/* Top-right Fig. 01 annotation */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-32 hidden md:block md:right-10 lg:right-12 font-body text-overline tracking-overline uppercase text-brand-300/70"
        >
          Fig. 01
        </span>
      </Section>

      {/* — SECTION 2: THE PROBLEM WE REFUSED TO INHERIT — */}
      <PullQuoteSection
        figNumber="02"
        pullQuote={<>What the industry got wrong.</>}
        bloomVariant="thesis"
      >
        <DropCapParagraph>
          For thirty years, laser dermatology optimized for the easiest cases.
          Lighter skin types. Predictable indications. Settings that worked on
          the patients the industry was already comfortable treating. Everyone
          else &mdash; Fitzpatrick III, IV, V, VI; melasma; post-inflammatory
          hyperpigmentation; complex pigmentary disorders &mdash; was treated
          with the same hardware and prayed over with adjusted parameters.
        </DropCapParagraph>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          The result was an industry that produced inconsistent outcomes for
          the patients who needed consistency the most. Practitioners learned
          to manage expectations. Patients learned to expect uneven care. The
          technology kept advancing. The framework around it didn&rsquo;t.
        </p>
        <PivotLine className="mt-8">We started over.</PivotLine>
      </PullQuoteSection>

      {/* — SECTION 3: WHY "SYSTEM" — */}
      <PullQuoteSection
        figNumber="03"
        pullQuote={<>A system is not a bundle.</>}
        flip
        bloomVariant="outcomes"
      >
        <DropCapParagraph>
          The word &ldquo;system&rdquo; is overused. Most companies that call
          their offering a system are selling a device with a few accessories
          attached. We use the word literally. The Precise System is four
          engineered components that depend on each other to produce a clinical
          outcome. Removing any one of them does not give you three-quarters of
          a system. It gives you something that cannot do the job.
        </DropCapParagraph>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          Protocols are the medicine &mdash; indication-specific frameworks,
          including the PIH Prevention Protocol<TrademarkSymbol />, that
          determine how energy is applied to skin. The device is the instrument
          that executes those protocols with multi-wavelength pico precision.
          Biologic control is the engineered prep, recovery, and maintenance
          regimen that supports the skin before, during, and between treatments.
          The Data Intelligence Layer captures real outcomes and refines the
          protocols over time.
        </p>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          A laser without protocols is a tool without instructions. A protocol
          without biologic control is a plan without a patient. A device
          without outcome data is a machine that cannot improve. The four exist
          together, or the system does not exist.
        </p>
      </PullQuoteSection>

      {/* — SECTION 4: WHY FOUR + ARCHITECTURE DIAGRAM — */}
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
              § Fig. 04 &mdash; The architecture
            </p>
          </div>
          <DisplayHeading
            level="md"
            as="h2"
            className="mt-8 max-w-[20ch] text-cream-50"
          >
            The four are not a marketing structure.
          </DisplayHeading>
          <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-cream-100">
            We arrived at four pillars by working backward from what produces
            predictable outcomes across Fitzpatrick I through VI. Three pillars
            left a gap &mdash; usually around either healing, refinement, or
            both. Five became redundant; the fifth was always a feature of one
            of the other four wearing a different name.
          </p>
          <PivotLine tone="dark" className="mt-8">
            Four is not a number we settled on. It is the number the
            engineering required.
          </PivotLine>
          <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-cream-100">
            Each pillar has a single job. Protocols define the{" "}
            <em className="italic">what</em>. The device delivers the{" "}
            <em className="italic">how</em>. Biologic control governs the{" "}
            <em className="italic">recovery</em>. The Data Intelligence Layer
            enables the <em className="italic">refinement</em>. Together they
            form a closed loop &mdash; every treatment makes the next one more
            predictable.
          </p>
        </div>

        {/* The architecture diagram — central visual of the page */}
        <div className="relative mt-20 mx-auto max-w-[840px]">
          <ArchitectureDiagram variant="main" />
        </div>
      </Section>

      {/* — SECTION 5: WHAT THE PRECISE SYSTEM IS — */}
      <Section
        tone="bone"
        size="default"
        className="relative isolate overflow-hidden"
      >
        <BoneBlooms variant="lead" />

        <div className="relative flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-500"
            />
            <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-700">
              § Fig. 05
            </p>
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-500"
            />
          </div>

          <DisplayHeading level="md" as="h2" className="mt-10 max-w-[22ch]">
            What the Precise System is.
          </DisplayHeading>

          <p className="mt-10 font-body text-body leading-body max-w-[58ch] text-ink-700">
            The Precise System is a single architecture. The four pillars are
            not products sold separately and bundled together for convenience.
            They were designed in concert and engineered to function as one
            closed-loop clinical system.
          </p>

          <PivotLine size="lg" align="center" className="mt-12 max-w-[34ch]">
            Practitioners do not buy a device from us. They buy into a system.
          </PivotLine>
        </div>
      </Section>

      {/* — SECTION 6: THE CLOSED LOOP + ITERATION RINGS — */}
      <Section
        tone="midnight-deep"
        size="default"
        className="relative isolate overflow-hidden"
      >
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 lg:items-center">
          {/* Left col: editorial body */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="block h-px w-[60px] bg-brand-300/60"
              />
              <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-300">
                § Fig. 06
              </p>
            </div>
            <DisplayHeading
              level="md"
              as="h2"
              className="mt-8 max-w-[18ch] text-cream-50"
            >
              Every cycle gets sharper.
            </DisplayHeading>
            <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-cream-100">
              This is the mechanism most aesthetic technologies do not have.
              Treatment outcomes flow back into the Data Intelligence Layer.
              The protocol library updates based on real-world results across
              the practitioner network. The next session a practitioner runs is
              informed by the aggregated outcomes of every prior session
              &mdash; not just their own, but every Precise practitioner&rsquo;s.
            </p>
            <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-cream-100">
              The system is not static. It learns. Over months and years, the
              protocols become more precise, the recovery regimens more
              refined, the device parameters more tuned. The longer the system
              runs, the better it gets &mdash; for every practitioner using it.
            </p>
            <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-cream-100">
              This is the difference between buying a piece of equipment and
              joining a clinical network.
            </p>
          </div>

          {/* Right col: concentric iteration rings diagram */}
          <div className="lg:col-span-5">
            <IterationRings />
          </div>
        </div>
      </Section>

      {/* — SECTION 7: THE STANDARD WE HOLD — */}
      <Section
        tone="bone"
        size="default"
        className="relative isolate overflow-hidden"
      >
        <BoneBlooms variant="thesis" />

        <div className="relative flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-500"
            />
            <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-700">
              § Fig. 07
            </p>
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-500"
            />
          </div>

          <DisplayHeading level="md" as="h2" className="mt-10 max-w-[22ch]">
            The patients we built this for.
          </DisplayHeading>

          <p className="mt-10 font-body text-body leading-body max-w-[58ch] text-ink-700">
            Every decision in the architecture was tested against a single
            standard: does this produce consistent, predictable outcomes for
            Fitzpatrick I through VI &mdash; including the darker skin types
            that the industry has historically struggled to treat?
          </p>

          <PivotLine align="center" className="mt-8 max-w-[36ch]">
            If the answer was no, we changed the inputs.
          </PivotLine>

          <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-ink-700">
            The result is a system that works across the full skin-type
            spectrum. Not by accident. Not by adjusting parameters case by
            case. By design.
          </p>
        </div>
      </Section>

      {/* — SECTION 8: CLOSING + CTA — */}
      <Section
        tone="midnight-deep"
        size="default"
        className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_55%_70%_at_50%_50%,_#1F2F4F_0%,_#0C1426_72%)]"
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

        <div className="relative flex flex-col items-center text-center">
          <DisplayHeading
            level="lg"
            as="h2"
            className="max-w-[22ch] italic text-cream-50"
          >
            This is what a clinical system looks like.
          </DisplayHeading>

          <p className="mt-10 font-body text-lead leading-body max-w-[44ch] text-cream-100">
            Four pillars. One closed loop. Predictable outcomes across every
            skin type.
          </p>

          <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
            <Button asChild variant="primary-on-dark" size="lg">
              <Link href="/demo">Request a demonstration</Link>
            </Button>
            <Button asChild variant="secondary-on-dark" size="lg">
              <Link href="/system/data-intelligence">See the data layer</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
