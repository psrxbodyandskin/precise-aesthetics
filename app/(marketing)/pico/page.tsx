import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/marketing/Section";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Lead } from "@/components/marketing/typography/Lead";
import { TrademarkSymbol } from "@/components/marketing/typography/TrademarkSymbol";
import { Button } from "@/components/ui/button";
import { BoneBlooms } from "@/components/marketing/BoneBlooms";
import { RevealPlaceholder } from "@/components/marketing/pico/RevealPlaceholder";
import { WavelengthCard } from "@/components/marketing/pico/WavelengthCard";
import { SpecTable, type SpecGroup } from "@/components/marketing/pico/SpecTable";
import { PullQuoteSection } from "@/components/marketing/system/PullQuoteSection";
import { DropCapParagraph } from "@/components/marketing/system/DropCapParagraph";
import { PivotLine } from "@/components/marketing/system/PivotLine";
import {
  StructuredGrid,
  type NumberedItem,
} from "@/components/marketing/system/StructuredGrid";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

// [DRAFT — clinical review required] Wavelength card copy drafted by build.
const WAVELENGTHS = [
  {
    eyebrow: "Neodymium YAG",
    wavelength: "1064 nm",
    description: (
      <>
        The deepest-penetrating wavelength in the system. Targets dermal
        pigment and tattoo ink without surface absorption &mdash; making it
        the workhorse for darker skin types where epidermal melanin would
        absorb shorter wavelengths.
      </>
    ),
    indications: [
      "Deep pigment",
      "Black/blue tattoo ink",
      "Dermal melasma",
      "Nevus of Ota",
      "Café-au-lait macules",
    ],
  },
  {
    eyebrow: "KTP / Frequency-doubled YAG",
    wavelength: "532 nm",
    description: (
      <>
        Strongly absorbed by red, orange, and yellow chromophores. The
        wavelength of choice for superficial pigmented lesions and specific
        tattoo ink colors.
      </>
    ),
    indications: [
      "Lentigines",
      "Freckles",
      "Café-au-lait macules",
      "Red/orange/yellow tattoo ink",
      "Vascular lesions",
    ],
  },
  {
    eyebrow: "Alexandrite",
    wavelength: "755 nm",
    description: (
      <>
        Optimized for green and blue tattoo ink absorption, and effective on
        epidermal pigment in lighter skin types. Provides clinical
        flexibility for tattoo removal across the spectrum of ink colors.
      </>
    ),
    indications: [
      "Green and blue tattoo ink",
      "Lentigines on Fitz I–III",
      "Specific dyschromias",
    ],
  },
  {
    eyebrow: "Picosecond Precision",
    wavelength: "785 nm",
    description: (
      <>
        The fourth wavelength extends the device&rsquo;s reach into
        indications that benefit from a balance between depth penetration and
        chromophore selectivity. Calibrated for the Precise protocols where
        1064 nm and 755 nm together cannot fully address the target.
      </>
    ),
    indications: [
      "Mixed-color tattoo",
      "Refractory dyschromias",
      "Transitional melanin targets",
    ],
  },
];

// [DRAFT — pending approval] Practitioner workflow steps drafted by build.
const WORKFLOW_STEPS: NumberedItem[] = [
  {
    number: "01",
    heading: "Indication selection",
    body: "The practitioner selects the indication and the patient's Fitzpatrick type. The device loads the corresponding protocol from the library.",
  },
  {
    number: "02",
    heading: "Parameter envelope",
    body: "The protocol defines the safe operating range — wavelength, fluence, pulse duration, spot size — calibrated to the indication and skin type. Manual override is available within engineered safety boundaries.",
  },
  {
    number: "03",
    heading: "Treatment execution",
    body: "Real-time feedback on pulse count, fluence delivered, and treatment zone coverage. Interface designed for minimal cognitive load during treatment.",
  },
  {
    number: "04",
    heading: "Outcome capture",
    body: "The practitioner logs the treatment outcome at the device or in the practitioner portal. The data flows to the Data Intelligence Layer, contributing to protocol refinement across the network.",
  },
  {
    number: "05",
    heading: "Continuous updates",
    body: "When protocols are updated based on aggregated outcomes, the device receives the new version automatically. The next treatment uses the refined parameters.",
  },
];

// [DRAFT — pending approval] Included-with-Pico kit items drafted by build.
const INCLUDED_ITEMS: NumberedItem[] = [
  {
    number: "01",
    heading: <>Precise Pico console</>,
    body: "Multi-wavelength pico laser, configured and calibrated.",
  },
  {
    number: "02",
    heading: "Handpiece set",
    body: "Standard treatment handpiece + fractional handpiece for textural protocols.",
  },
  {
    number: "03",
    heading: "Protocol library access",
    body: "All current protocols loaded on the device. Continuous updates via practitioner portal sync.",
  },
  {
    number: "04",
    heading: "Biologic Control starter kit",
    body: "Prep, recovery, and maintenance kits sufficient for first 30 patient treatments.",
  },
  {
    number: "05",
    heading: "Practitioner portal account",
    body: "Outcome logging interface, training library access, protocol update notifications, anonymized network insights.",
  },
  {
    number: "06",
    heading: "Onboarding & certification",
    body: "On-site delivery, installation, and a two-day clinical certification program for the practice's clinical team.",
  },
  {
    number: "07",
    heading: "Annual service & calibration",
    body: "Year one included. Annual maintenance contract available thereafter.",
  },
  {
    number: "08",
    heading: "Software & protocol updates",
    body: "Included for the life of the device.",
  },
];

// [DRAFT SPECS — values are realistic industry-standard pico parameters;
// confirm against final device assembly before launch]
const SPEC_GROUPS: SpecGroup[] = [
  {
    category: "Wavelengths",
    rows: [
      {
        value: [
          "1064 nm (Nd:YAG)",
          "532 nm (KTP / Frequency-doubled Nd:YAG)",
          "755 nm (Alexandrite)",
          "785 nm (Picosecond)",
        ],
      },
    ],
  },
  {
    category: "Pulse Duration",
    rows: [
      {
        value: [
          "450 picoseconds (1064 nm)",
          "370 picoseconds (532 nm)",
          "500 picoseconds (755 nm)",
          "400 picoseconds (785 nm)",
        ],
      },
    ],
  },
  {
    category: "Maximum Pulse Energy",
    rows: [
      {
        value: [
          "600 mJ (1064 nm)",
          "300 mJ (532 nm)",
          "200 mJ (755 nm)",
          "250 mJ (785 nm)",
        ],
      },
    ],
  },
  {
    category: "Maximum Repetition Rate",
    rows: [{ value: "10 Hz across all wavelengths" }],
  },
  {
    category: "Spot Sizes",
    rows: [
      {
        value: [
          "2 mm to 10 mm, adjustable in 1 mm increments",
          "Specialized fractional handpiece for textural protocols",
        ],
      },
    ],
  },
  {
    category: "Beam Profile",
    rows: [
      {
        value: [
          "Flat-top homogenized beam profile",
          "±5% energy uniformity across spot",
        ],
      },
    ],
  },
  {
    category: "Cooling System",
    rows: [
      {
        value: [
          "Integrated air cooling for handpiece thermal management",
          "No external chiller required",
        ],
      },
    ],
  },
  {
    category: "Display",
    rows: [
      {
        value: [
          "13-inch capacitive touchscreen",
          "Protocol library integrated — practitioner selects indication, device loads parameter envelope",
          "Real-time outcome logging interface (writes to Data Intelligence Layer)",
        ],
      },
    ],
  },
  {
    category: "Connectivity",
    rows: [
      {
        value: [
          "Wi-Fi (WPA3) + Ethernet for portal sync",
          "HIPAA-compliant data transmission",
          "Practitioner portal session sync",
        ],
      },
    ],
  },
  {
    category: "Dimensions",
    rows: [
      {
        value: [
          "28″ W × 24″ D × 42″ H (console)",
          "95 lbs (43 kg)",
          "Casters with floor lock",
        ],
      },
    ],
  },
  {
    category: "Power Requirements",
    rows: [
      {
        value: [
          "110–240V AC, 50/60 Hz",
          "15A dedicated circuit recommended",
        ],
      },
    ],
  },
  {
    category: "Compliance & Certification",
    rows: [
      {
        value: [
          "FDA 510(k) cleared (pending — see footnote)",
          "IEC 60601-1 medical device safety",
          "IEC 60825-1 laser safety Class 4",
          "HIPAA-compliant data handling",
        ],
      },
    ],
  },
  {
    category: "Warranty",
    rows: [
      {
        value: [
          "24 months parts and labor",
          "Software updates included for life of device",
          "Protocol library updates included with practitioner subscription",
        ],
      },
    ],
  },
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Precise Pico™ — The Precise System",
  description:
    "A four-wavelength pico laser engineered to execute the Precise System protocols with sub-nanosecond precision. Built for predictable outcomes across Fitzpatrick I through VI.",
  alternates: { canonical: `${SITE.url}/pico` },
  openGraph: {
    title: "Precise Pico™ — The Precise System",
    description:
      "Four-wavelength pico laser. Built for the protocol library, calibrated for Fitzpatrick I–VI.",
    url: `${SITE.url}/pico`,
    siteName: SITE.name,
    type: "website",
  },
};

export default function PicoPage() {
  return (
    <>
      {/* — SECTION 1: Hero — */}
      <Section
        tone="midnight-deep"
        size="hero"
        className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_55%_70%_at_50%_45%,_#1F2F4F_0%,_#0C1426_72%)]"
      >
        {/* Film-grain overlay — atmospheric continuity with homepage + pillar pages */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
            backgroundSize: "160px 160px",
          }}
        />

        <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 lg:items-center">
          {/* Left col — editorial copy */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="block h-px w-[60px] bg-brand-300/60"
              />
              <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-300">
                § The first device
              </p>
            </div>

            <DisplayHeading
              level="lg"
              as="h1"
              className="mt-8 max-w-[18ch] text-cream-50"
            >
              Precise Pico<TrademarkSymbol />.
              <br />
              <span className="italic">The instrument of the system.</span>
            </DisplayHeading>

            <Lead className="mt-8 max-w-[44ch] text-cream-100">
              A four-wavelength pico laser engineered to execute the Precise
              System protocols with sub-nanosecond precision. Built for
              predictable outcomes across Fitzpatrick I through VI.
            </Lead>

            <div className="mt-12 flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
              <Button asChild variant="primary-on-dark" size="lg">
                <Link href="/demo">Request a demonstration</Link>
              </Button>
              <Button asChild variant="secondary-on-dark" size="lg">
                <Link href="/system">See the system architecture</Link>
              </Button>
            </div>
          </div>

          {/* Right col — RevealPlaceholder (4:3) */}
          <div className="lg:col-span-5">
            <RevealPlaceholder
              aspectRatio="4/3"
              tone="midnight"
              fig="01"
              caption="Reveal · August 8, 2026"
            />
          </div>
        </div>
      </Section>

      {/* — SECTION 2: Why Pico Exists in the System — */}
      <PullQuoteSection
        figNumber="02"
        pullQuote={<>The device is the instrument, not the system.</>}
        bloomVariant="thesis"
      >
        {/* [DRAFT — pending approval] */}
        <DropCapParagraph>
          Precise Pico is the device that executes the Delivery pillar of
          The Precise System. The system existed first. The protocols, the
          biologic control framework, and the Data Intelligence Layer were
          designed before any hardware was specified. Precise Pico was
          engineered to meet the architectural requirements those decisions
          created &mdash; multi-wavelength capability for varied indications,
          sub-nanosecond pulse precision for predictable pigment disruption,
          and parameter calibration tied directly to the protocol library.
        </DropCapParagraph>
        <p className="mt-6 font-body text-body leading-body max-w-[58ch] text-ink-700">
          A different device could occupy this pillar in the future. Future
          Precise devices will. The architecture stays. The instrument
          evolves.
        </p>
        <PivotLine tone="light" className="mt-10 max-w-[40ch]">
          The hardware was the last thing we engineered.
        </PivotLine>
        <Link
          href="/system/delivery"
          className={cn(
            "mt-10 inline-flex items-center gap-2",
            "font-body text-small text-brand-700 hover:text-brand-500",
            "transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm",
          )}
        >
          <span>See how delivery fits into the system</span>
          <ArrowRight
            className="size-4"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </Link>
      </PullQuoteSection>

      {/* — SECTION 3: The Four Wavelengths — */}
      <Section
        tone="midnight-deep"
        size="default"
        className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_55%_70%_at_50%_45%,_#1F2F4F_0%,_#0C1426_72%)]"
      >
        {/* Film-grain overlay */}
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
              § Fig. 02 — The wavelengths
            </p>
          </div>
          <DisplayHeading
            level="md"
            as="h2"
            className="mt-8 max-w-[16ch] text-cream-50"
          >
            Four wavelengths.
            <br />
            <span className="italic">One instrument.</span>
          </DisplayHeading>
          <Lead className="mt-8 text-cream-100">
            Each wavelength in Precise Pico is calibrated to a category of
            clinical indication. Together, they cover the full spectrum of
            treatable targets &mdash; from deep dermal pigment to superficial
            dyschromia to vascular features to textural concerns.
          </Lead>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          {WAVELENGTHS.map((w) => (
            <WavelengthCard
              key={w.wavelength}
              eyebrow={w.eyebrow}
              wavelength={w.wavelength}
              description={w.description}
              indications={w.indications}
            />
          ))}
        </div>

        {/* [DRAFT — clinical review required] flag */}
        <p className="relative mt-12 font-body text-caption text-cream-300/70 max-w-[58ch]">
          Indication lists above are representative and require clinical
          review before launch.
        </p>
      </Section>

      {/* — SECTION 4: Engineering Specs — */}
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
              § Fig. 03 — Engineering
            </p>
          </div>
          <DisplayHeading level="md" as="h2" className="mt-8 max-w-[18ch]">
            Engineering specifications.
          </DisplayHeading>
          <p className="mt-8 font-body text-body leading-body max-w-[58ch] text-ink-700">
            Precise Pico is engineered to clinical specifications, not
            consumer preferences. The values below are the operating
            parameters that make the protocol library executable with
            predictable results.
          </p>
        </div>

        <div className="relative mt-16">
          <SpecTable groups={SPEC_GROUPS} />
        </div>

        {/* FDA 510(k) regulatory footnote + draft flag */}
        <div className="relative mt-10 max-w-[58ch] space-y-3">
          <p className="font-body text-caption leading-body text-ink-500">
            FDA 510(k) clearance is in process; final regulatory status will
            be confirmed prior to launch. The Precise Pico
            <TrademarkSymbol /> device is not yet available for sale or
            clinical use in the United States.
          </p>
          <p className="font-body text-caption leading-body text-ink-500">
            Specifications listed above are draft engineering targets and may
            be updated based on final device assembly and validation testing.
          </p>
        </div>
      </Section>

      {/* — SECTION 5: The Practitioner Experience — */}
      <Section
        tone="midnight-deep"
        size="default"
        className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_55%_70%_at_50%_45%,_#1F2F4F_0%,_#0C1426_72%)]"
      >
        {/* Film-grain overlay */}
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
              § Fig. 04 — The workflow
            </p>
          </div>
          <DisplayHeading
            level="md"
            as="h2"
            className="mt-8 max-w-[20ch] text-cream-50"
          >
            Designed for the way protocols are executed.
          </DisplayHeading>
          <Lead className="mt-8 text-cream-100">
            The device interface is built around the protocol library, not
            around hardware controls. Practitioners select the indication.
            The device loads the protocol&rsquo;s parameter envelope. The
            treatment is executed within engineered safety boundaries
            &mdash; and the outcome flows back to the Data Intelligence
            Layer.
          </Lead>
        </div>

        <div className="relative mt-16 max-w-[58ch]">
          <StructuredGrid variant="numbered" items={WORKFLOW_STEPS} tone="dark" />
        </div>

        <div className="relative mt-12">
          <Link
            href="/system/data-intelligence"
            className={cn(
              "inline-flex items-center gap-2",
              "font-body text-small text-brand-300 hover:text-brand-200",
              "transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm",
            )}
          >
            <span>See the Data Intelligence Layer</span>
            <ArrowRight
              className="size-4"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </Link>
        </div>
      </Section>

      {/* — SECTION 6: What's in the System — */}
      <Section
        tone="bone"
        size="default"
        className="relative isolate overflow-hidden"
      >
        <BoneBlooms variant="practitioner" />

        <div className="relative max-w-[58ch]">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-500"
            />
            <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-700">
              § Included with Precise Pico<TrademarkSymbol />
            </p>
          </div>
          <DisplayHeading level="md" as="h2" className="mt-8 max-w-[18ch]">
            What arrives at the practice.
          </DisplayHeading>
        </div>

        <div className="relative mt-16">
          <ul
            role="list"
            className={cn(
              "grid grid-cols-1 md:grid-cols-2",
              "border-t border-l border-[color:var(--pa-border-default)]",
            )}
          >
            {INCLUDED_ITEMS.map((item) => (
              <li
                key={item.number}
                className={cn(
                  "border-r border-b border-[color:var(--pa-border-default)]",
                  "p-8 md:p-10",
                )}
              >
                <div className="flex items-baseline gap-4">
                  <span
                    className="font-display italic text-h2 leading-none text-ink-900/70"
                    aria-hidden="true"
                  >
                    {item.number}
                  </span>
                  <p className="font-display text-h4 leading-tight text-ink-900">
                    {item.heading}
                  </p>
                </div>
                <p className="mt-3 font-body text-small leading-body text-ink-700">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* — SECTION 7: The Reveal Moment — */}
      <Section
        tone="midnight-deep"
        size="hero"
        className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_55%_70%_at_50%_45%,_#1F2F4F_0%,_#0C1426_72%)]"
      >
        {/* Film-grain overlay */}
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
          {/* Champagne eyebrow — sanctioned moment 1/2 */}
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-champagne-200/60"
            />
            <p className="font-body text-overline tracking-overline font-medium uppercase text-champagne-200">
              § The unveiling
            </p>
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-champagne-200/60"
            />
          </div>

          <DisplayHeading
            level="lg"
            as="h2"
            className="mt-10 max-w-[20ch] text-cream-50 italic"
          >
            Precise Pico<TrademarkSymbol /> is unveiled at the launch event.
          </DisplayHeading>

          <p className="mt-8 font-body text-body leading-body max-w-[52ch] text-cream-100">
            By invitation only. Civic Opera Building, Chicago.
            August&nbsp;8,&nbsp;2026.
          </p>

          <div className="mt-16 w-full max-w-[1080px]">
            <RevealPlaceholder
              aspectRatio="16/9"
              tone="midnight"
              fig="07"
              caption="Unveiled at the Civic Opera Building"
            />
          </div>

          <div className="mt-16">
            {/* Champagne CTA — sanctioned moment 2/2 */}
            <Button asChild variant="champagne" size="lg">
              <Link href="/launch">Request an invitation</Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* — SECTION 8: Closing CTA — */}
      <Section
        tone="bone"
        size="default"
        className="relative isolate overflow-hidden"
        id="updates"
      >
        <BoneBlooms variant="lead" />

        <div className="relative flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-500"
            />
            <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-700">
              § Ready to see the instrument
            </p>
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-500"
            />
          </div>
          <DisplayHeading level="md" as="h2" className="mt-8 max-w-[18ch]">
            Schedule a demonstration.
          </DisplayHeading>
          <p className="mt-8 font-body text-body leading-body max-w-[52ch] text-ink-700">
            Demonstrations begin at launch. Practitioners interested in
            Precise Pico and the full Precise System can reserve a slot now.
          </p>
          <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
            <Button asChild variant="primary" size="lg">
              <Link href="/demo">Request a demonstration</Link>
            </Button>
            <Link
              href="#updates"
              className={cn(
                "font-body text-small text-brand-700 hover:text-brand-500",
                "transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm",
                "inline-flex items-center gap-2",
              )}
            >
              <span>Or get launch updates</span>
              <ArrowRight
                className="size-4"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
