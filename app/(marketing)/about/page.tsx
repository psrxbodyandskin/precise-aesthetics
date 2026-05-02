import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";

// /about is intentionally treated as a published document, not marketing copy.
// Two intentional, page-only deviations are baked in here. Do not "normalize"
// them to MASTER.md tokens or BRAND-IDENTITY conventions:
//
// 1. Eyebrow letter-spacing is 0.18em (literal), not the standard 0.12em
//    --tracking-overline token. This is a deliberate document-register
//    override per spec/SESSION-8-ABOUT-PAGE.md.
//
// 2. The body copy is rendered verbatim from spec/ABOUT-DOCUMENT-FINAL-V2.md.
//    It does NOT include ™ on "Precise System", "Precise Pico", or
//    "Data Intelligence Layer" — the locked document is prose, not marketing.
//    Do not auto-insert trademark symbols.

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "About — Precise Aesthetics",
  description:
    "A document on why we exist. The patients we built this for, what we believe, and the standard we hold.",
  alternates: { canonical: `${SITE.url}/about` },
  openGraph: {
    title: "About — Precise Aesthetics",
    description: "A document on why we exist.",
    url: `${SITE.url}/about`,
    siteName: SITE.name,
    type: "article",
  },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default function AboutPage() {
  return (
    <div className="bg-bone-100 pt-24 md:pt-28">
      <article className="relative mx-auto max-w-[680px] px-6 py-20 md:px-12 md:py-32">
        {/* Fig. 00 annotation — top-right of the document column */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-20 font-body text-overline uppercase text-ink-500 md:right-12 md:top-32"
          style={EYEBROW_TRACKING}
        >
          Fig. 00
        </span>

        {/* Top page hairline — sits in upper page padding, above the eyebrow */}
        <div
          aria-hidden="true"
          className="mb-16 flex justify-center md:mb-24"
        >
          <span className="block h-px w-[60px] bg-brand-500/50" />
        </div>

        {/* Page title */}
        <header>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            § On the company
          </p>
          <h1
            className="mt-10 font-display text-ink-900"
            style={{
              fontSize: "clamp(3.5rem, 6vw + 1rem, 7.5rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            A document on
            <br />
            <span className="italic">why we exist.</span>
          </h1>
        </header>

        {/* Opening passage — slightly larger than body prose */}
        <section
          className="mt-24 font-body text-ink-700"
          style={{
            fontSize: "clamp(1.1875rem, 0.5vw + 1rem, 1.375rem)",
            lineHeight: 1.7,
          }}
        >
          <p>
            This is the company in its own words. The reasons we exist. The
            patients we built this for. The standard we hold.
          </p>
          <p className="mt-6">Read it as a document, not a brochure.</p>
        </section>

        {/* — Section divider — */}
        <SectionDivider />

        {/* Section I */}
        <DocumentSection numeral="I." title="The patients we built this for.">
          <Paragraph>
            Laser dermatology has long optimized for the easiest cases &mdash;
            lighter skin types, predictable indications, settings that worked
            on patients the industry was already comfortable treating.
          </Paragraph>
          <Paragraph>
            Everyone else was an exception. Fitzpatrick III, IV, V, VI.
            Melasma. Post-inflammatory hyperpigmentation. Complex pigmentary
            disorders. The deeper the skin tone, the more the standard of
            care narrowed to &ldquo;treat carefully and hope.&rdquo;
          </Paragraph>
          <PivotLine>We built the system for the patients first.</PivotLine>
          <Paragraph>
            The protocols were engineered around what produces consistent
            outcomes across Fitzpatrick I through VI &mdash; including the
            darker skin types the industry has historically struggled to
            treat. The biologic control kits were formulated for tolerance
            across the spectrum, not for the easiest skin to test on. The
            data layer was designed to track outcomes per skin type so
            refinements would never advantage one population over another.
          </Paragraph>
          <Paragraph>This is not a marketing position.</Paragraph>
          <PivotLine>It is the engineering brief.</PivotLine>
        </DocumentSection>

        <SectionDivider />

        {/* Section II */}
        <DocumentSection numeral="II." title="What we believe.">
          <Paragraph>We believe a system is not a bundle.</Paragraph>
          <Paragraph>
            The Precise System is four engineered components that depend on
            each other to produce a clinical outcome. Removing any one of
            them does not give you three-quarters of a system. It gives you
            something that cannot do the job.
          </Paragraph>
          <Paragraph>
            We believe the device is the instrument. The protocol is the
            medicine.
          </Paragraph>
          <Paragraph>
            The protocols define the clinical framework. The device executes
            them. The biologic control kits support the skin around
            treatment. The Data Intelligence Layer refines all of it over
            time. Each part has one job. Together, they form a closed loop.
          </Paragraph>
          <Paragraph>We believe outcome data is a clinical input.</Paragraph>
          <Paragraph>
            When practitioners log treatment outcomes, the data flows into
            the protocol library and refines it. The Data Intelligence Layer
            exists to make every cycle sharper &mdash; for every practitioner
            using the system.
          </Paragraph>
          <Paragraph>We believe a clinical brand should be quiet.</Paragraph>
          <Paragraph>
            The work speaks. Or it doesn&rsquo;t, and we change the work.
          </Paragraph>
        </DocumentSection>

        <SectionDivider />

        {/* Section III */}
        <DocumentSection numeral="III." title="The standard.">
          <Paragraph>
            Every decision in the architecture was tested against a single
            standard: does this produce consistent, predictable outcomes for
            Fitzpatrick I through VI?
          </Paragraph>
          <Paragraph>If the answer was no, we changed the inputs.</Paragraph>
          <Paragraph>
            Not the marketing. Not the patient selection. Not the
            post-treatment expectation management. The inputs.
          </Paragraph>
          <Paragraph>
            That standard applies to every decision we have not yet made.
            Every device that follows Precise Pico. Every protocol that
            joins the library. Every kit that ships. Every line of code in
            the Data Intelligence Layer. Every practitioner we onboard.
          </Paragraph>
          <PivotLine>The standard does not move.</PivotLine>
        </DocumentSection>

        <SectionDivider />

        {/* End of document — quiet footer with three text links */}
        <footer className="mt-16 flex flex-col items-center text-center">
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            § End of document
          </p>
          <ul
            role="list"
            className="mt-10 flex flex-col items-center gap-6 md:flex-row md:gap-12"
          >
            {[
              { label: "The architecture", href: "/system" },
              { label: "The instrument", href: "/pico" },
              { label: "The launch", href: "/launch" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-body text-[14px] leading-body text-ink-700 transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
                >
                  {link.label} <span aria-hidden="true">&rarr;</span>
                </Link>
              </li>
            ))}
          </ul>
        </footer>

        {/* Bottom page hairline — sits in lower page padding, below the footer */}
        <div
          aria-hidden="true"
          className="mt-16 flex justify-center md:mt-24"
        >
          <span className="block h-px w-[60px] bg-brand-500/50" />
        </div>
      </article>
    </div>
  );
}

// — Internal helpers — kept inline; no new exported primitives.

function SectionDivider() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center py-12 md:py-16"
    >
      <span className="block h-px w-[60px] bg-brand-500/50" />
    </div>
  );
}

function DocumentSection({
  numeral,
  title,
  children,
}: {
  numeral: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {numeral}
      </p>
      <h2
        className="mt-3 font-display text-ink-900"
        style={{
          fontSize: "clamp(1.75rem, 1vw + 1rem, 2.25rem)",
          lineHeight: 1.15,
          letterSpacing: "-0.015em",
          fontWeight: 400,
        }}
      >
        {title}
      </h2>
      <div
        className="mt-10 font-body text-ink-700"
        style={{
          fontSize: "clamp(1.0625rem, 0.5vw + 0.875rem, 1.25rem)",
          lineHeight: 1.7,
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="mt-[1.2em] first:mt-0">{children}</p>;
}

function PivotLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="my-6 font-display italic leading-tight text-ink-900">
      {children}
    </p>
  );
}
