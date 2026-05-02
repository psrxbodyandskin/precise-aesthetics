import type { Metadata } from "next";
import { Section } from "@/components/marketing/Section";
import { BoneBlooms } from "@/components/marketing/BoneBlooms";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Lead } from "@/components/marketing/typography/Lead";
import { TrademarkSymbol } from "@/components/marketing/typography/TrademarkSymbol";
import { DemoRequestForm } from "@/components/forms/DemoRequestForm";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Request a demonstration — Precise Aesthetics",
  description:
    "Schedule a clinical demonstration of the Precise System. Demonstrations begin at launch — August 8, 2026, Civic Opera Building, Chicago.",
  alternates: {
    canonical: `${SITE.url}/demo`,
  },
  openGraph: {
    title: "Request a demonstration — Precise Aesthetics",
    description:
      "Schedule a clinical demonstration of the Precise System.",
    url: `${SITE.url}/demo`,
    siteName: SITE.name,
    type: "website",
  },
};

// [CAL.COM — future session]
// Once Cal.com is provisioned, swap (or augment) the form-only flow with a
// Cal.com inline embed. For now, the form is the canonical demo intake.
export default function DemoPage() {
  return (
    <>
      {/* Hero — smaller than homepage hero, no 3D */}
      <Section tone="midnight-deep" size="default">
        <div className="max-w-[58ch]">
          <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-300">
            Request a demonstration
          </p>
          <DisplayHeading
            level="md"
            as="h1"
            className="mt-6 max-w-[20ch] text-cream-50"
          >
            See the system. Schedule with our team.
          </DisplayHeading>
          <Lead className="mt-8 text-cream-100">
            Demonstrations begin at launch &mdash; August 8, 2026, at the
            Civic Opera Building, Chicago. Practitioners requesting
            demonstrations now are first in queue for post-launch scheduling.
          </Lead>
        </div>
      </Section>

      {/* Form section */}
      <Section
        tone="bone"
        size="default"
        containerWidth="prose"
        className="relative isolate overflow-hidden"
      >
        <BoneBlooms variant="practitioner" />
        <div className="relative">
          <h2 className="font-display text-h2 leading-heading tracking-heading text-ink-900">
            Tell us about your practice.
          </h2>
          <p className="mt-4 font-body text-body leading-body text-ink-700 max-w-[58ch]">
            We use this information to tailor the demonstration to your
            indications, skin types treated, and current device mix. The Precise
            System<TrademarkSymbol /> is built for practitioners treating
            Fitzpatrick IV&ndash;VI; please let us know if that maps to your
            patient population.
          </p>
          <div className="mt-12">
            <DemoRequestForm />
          </div>
        </div>
      </Section>
    </>
  );
}
