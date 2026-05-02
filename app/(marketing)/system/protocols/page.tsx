import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/marketing/Section";
import { BoneBlooms } from "@/components/marketing/BoneBlooms";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Lead } from "@/components/marketing/typography/Lead";
import { TrademarkSymbol } from "@/components/marketing/typography/TrademarkSymbol";
import { Button } from "@/components/ui/button";
import { PillarHero } from "@/components/marketing/system/PillarHero";
import { PullQuoteSection } from "@/components/marketing/system/PullQuoteSection";
import { DropCapParagraph } from "@/components/marketing/system/DropCapParagraph";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Protocols — The Precise System",
  description:
    "The protocol library is the proprietary clinical IP at the center of the Precise System. Indication-specific frameworks engineered for Fitzpatrick I–VI.",
  alternates: { canonical: `${SITE.url}/system/protocols` },
  openGraph: {
    title: "Protocols — The Precise System",
    description:
      "The clinical IP at the center of the Precise System.",
    url: `${SITE.url}/system/protocols`,
    siteName: SITE.name,
    type: "website",
  },
};

// [DRAFT — pending approval] All copy on this page is drafted by the build,
// not pulled from a locked source. Mark as DRAFT for clinical review.

const PROTOCOL_CATEGORIES = [
  {
    name: "PIH Prevention Protocol™",
    desc: "The flagship framework — engineered to prevent post-inflammatory hyperpigmentation across Fitzpatrick I–VI from the first pulse.",
    indications: ["I–VI", "Pigment", "Melasma"],
  },
  {
    name: "Tattoo removal — across skin types",
    desc: "Multi-wavelength tattoo clearance protocols calibrated for ink color and skin type, including darker skin types historically excluded from safe treatment.",
    indications: ["I–VI", "Tattoo"],
  },
  {
    name: "Melasma treatment frameworks",
    desc: "Conservative-energy, multi-session frameworks engineered for melasma's unique recurrence profile.",
    indications: ["III–VI", "Pigment"],
  },
  {
    name: "Post-inflammatory hyperpigmentation",
    desc: "Targeted PIH clearance protocols, often paired with PIH Prevention regimens for adjacent skin areas.",
    indications: ["III–VI", "Pigment"],
  },
  {
    name: "Lentigines and sun damage",
    desc: "Solar lentigo and photodamage protocols across skin types, parameter-tuned by Fitzpatrick.",
    indications: ["I–IV", "Pigment"],
  },
  {
    name: "Café-au-lait macules",
    desc: "Conservative parameter envelopes for benign pigmented lesions where over-treatment risks lasting dyschromia.",
    indications: ["I–VI", "Pigment"],
  },
  {
    name: "Nevus of Ota / Hori's nevus",
    desc: "Dermal pigmentation protocols requiring precise depth control and extended treatment series.",
    indications: ["III–VI", "Pigment"],
  },
  {
    name: "Becker's nevus",
    desc: "Combined pigment and follicular protocols for this complex hamartomatous condition.",
    indications: ["II–V", "Pigment"],
  },
  {
    name: "Acne scar resurfacing",
    desc: "Pico-fractional resurfacing protocols for atrophic acne scarring across skin types.",
    indications: ["I–VI", "Textural"],
  },
  {
    name: "Fine lines and rhytids",
    desc: "Sub-thermal pico protocols engineered for collagen stimulation without surface ablation.",
    indications: ["I–IV", "Textural"],
  },
  {
    name: "Skin rejuvenation protocols",
    desc: "Tone-and-texture rejuvenation series, calibrated to baseline skin condition and Fitzpatrick type.",
    indications: ["I–VI", "Tone"],
  },
  {
    name: "General pigment correction",
    desc: "The umbrella framework for diffuse dyschromia not falling into a specific named indication.",
    indications: ["I–VI", "Pigment"],
  },
];

export default function ProtocolsPage() {
  return (
    <>
      <PillarHero
        pillar="protocols"
        pillarLabel="The first pillar"
        headingLine1={<>Protocols.</>}
        headingLine2={<>The medicine, not just the laser.</>}
        lead={
          <>
            The protocol library is the proprietary clinical IP at the center
            of the Precise System. Indication-specific frameworks engineered
            for Fitzpatrick I through VI &mdash; including the darker skin
            types the industry has historically struggled to treat.
          </>
        }
        figNumber="01"
      />

      {/* — SECTION 2: The Thesis — */}
      <PullQuoteSection
        figNumber="02"
        pullQuote={<>A laser without protocols is a tool without instructions.</>}
        bloomVariant="thesis"
      >
        {/* [DRAFT — pending approval] */}
        <DropCapParagraph>
          A protocol is not a setting. A protocol is a clinical framework.
          Patient assessment, indication identification, parameter selection,
          energy application sequence, biologic control coordination, and
          follow-up &mdash; together &mdash; define how a treatment is
          delivered and why it produces the outcome it does.
        </DropCapParagraph>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          Most laser systems sell parameters. Energy, pulse width, spot size,
          repetition rate. The practitioner is left to translate those numbers
          into clinical decisions, calibrating against patient skin type,
          indication severity, prior treatment history, and a dozen other
          variables. The result is wide variance in outcomes for the same
          equipment.
        </p>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          The Precise System sells protocols. Each protocol is a complete
          clinical decision tree authored by the clinical leadership and
          continuously refined through aggregated outcomes from the
          practitioner network. Parameters are downstream of the protocol
          &mdash; they are how the protocol is executed, not the protocol
          itself.
        </p>
      </PullQuoteSection>

      {/* — SECTION 3: Inside the protocol library — */}
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
            Inside the protocol library.
          </DisplayHeading>
          <Lead className="mt-8 text-ink-700">
            The library covers the indications most central to laser
            dermatology, with explicit parameter envelopes and biologic
            control coordination for each. Categories below are{" "}
            <em className="italic">representative</em> &mdash; the live
            library updates continuously as new protocols are authored and
            existing ones are refined.
          </Lead>
        </div>

        {/* Category grid */}
        <div className="relative mt-16 grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {PROTOCOL_CATEGORIES.map((cat) => (
            <article
              key={cat.name}
              className="relative bg-bone-50 p-6 md:p-8"
              style={{
                boxShadow:
                  "0 1px 1px rgba(31, 47, 79, 0.04), 0 6px 18px rgba(31, 47, 79, 0.05)",
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-300/60 to-transparent"
              />
              <h3 className="font-display text-h4 leading-tight text-ink-900">
                {cat.name}
              </h3>
              <p className="mt-3 font-body text-small leading-body text-ink-700 max-w-[36ch]">
                {cat.desc}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2" role="list">
                {cat.indications.map((tag) => (
                  <li
                    key={tag}
                    className="font-body text-overline tracking-overline font-medium uppercase text-brand-700 bg-brand-50 px-2 py-1"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Trust microcopy */}
        <p className="relative mt-12 font-body text-caption text-ink-500 max-w-[58ch]">
          {/* [DRAFT — clinical review required] */}
          The protocol library updates continuously based on aggregated
          outcomes. Practitioners using the system receive new and refined
          protocols automatically through the practitioner portal.
        </p>
      </Section>

      {/* — SECTION 4: How a protocol is built — */}
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
              § Fig. 04
            </p>
          </div>
          <DisplayHeading
            level="md"
            as="h2"
            className="mt-8 max-w-[18ch] text-cream-50"
          >
            How a protocol is built.
          </DisplayHeading>
          {/* [DRAFT — pending approval] */}
          <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-cream-100">
            Each entry in the protocol library is a complete, executable
            clinical framework. The components are not optional. Removing one
            does not give you a partial protocol &mdash; it gives you a
            parameter set that cannot reliably produce the indicated outcome.
          </p>
          <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-cream-100">
            Indication and patient assessment come first: Fitzpatrick type,
            indication severity, prior treatment history, contraindications.
            Parameter envelopes follow: wavelength selection, fluence range,
            pulse duration, spot size, repetition rate, and the safe
            adjustment ranges for each based on patient assessment.
          </p>
          <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-cream-100">
            Treatment sequence governs spacing between sessions, expected
            response milestones, and decision points for parameter
            adjustment. The required biologic control regimen is integrated
            directly: prep before the session, recovery in the critical
            window after, maintenance between treatments. Outcome capture
            is structured &mdash; the practitioner logs treatment results in
            the practitioner portal, which feeds the Data Intelligence Layer.
          </p>
          <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-cream-100">
            Continuous refinement closes the loop. Aggregated outcomes
            surface parameter adjustments, biologic control optimizations,
            and protocol updates. Approved updates push to the library and
            to every practitioner using the system.
          </p>
        </div>
      </Section>

      {/* — SECTION 5: The PIH Prevention Protocol™ Spotlight — */}
      <PullQuoteSection
        figNumber="05"
        eyebrowLabel="The flagship"
        pullQuote={
          <>
            The PIH Prevention Protocol<TrademarkSymbol />.
          </>
        }
        flip
        bloomVariant="lead"
      >
        {/* [DRAFT — clinical sign-off required] */}
        <DropCapParagraph>
          Post-inflammatory hyperpigmentation is the wedge. PIH is the most
          common &mdash; and most under-acknowledged &mdash; complication of
          laser treatment in skin of color. The same energy delivery that
          produces clean clearance on Fitzpatrick I–II can trigger weeks or
          months of hyperpigmented response on Fitzpatrick III–VI. The
          industry&rsquo;s default response has been to under-treat or not
          treat at all.
        </DropCapParagraph>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          The PIH Prevention Protocol<TrademarkSymbol /> was engineered for the
          full skin-type spectrum from the first patch test. Conservative
          energy envelopes calibrated to Fitzpatrick III, IV, V, and VI;
          mandatory prep regimen to stabilize melanocyte response before
          treatment; recovery regimen tuned to suppress inflammatory cascade
          in the critical 72 hours; structured outcome capture at scheduled
          follow-ups to surface emerging pigment shifts before they progress.
        </p>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          The result is a protocol that produces predictable clearance with
          dramatically reduced PIH events compared to standard pico
          frameworks &mdash; on the patient population the industry was
          historically least able to serve.
        </p>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          The protocol is not the laser. The laser executes the protocol.
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
            className="max-w-[20ch] text-cream-50"
          >
            Access the protocol library.
          </DisplayHeading>
          <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-cream-100">
            Practitioners using The Precise System gain full access to the
            protocol library through the practitioner portal. Updates and new
            protocols are pushed continuously based on real-world outcome
            data.
          </p>
          <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
            <Button asChild variant="primary-on-dark" size="lg">
              <Link href="/demo">Request a demonstration</Link>
            </Button>
            <Button asChild variant="secondary-on-dark" size="lg">
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
