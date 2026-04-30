import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/marketing/Section";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Heading } from "@/components/marketing/typography/Heading";
import { Lead } from "@/components/marketing/typography/Lead";
import { BodyText } from "@/components/marketing/typography/BodyText";
import { TrademarkSymbol } from "@/components/marketing/typography/TrademarkSymbol";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/forms/LeadForm";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Precise Aesthetics — Protocol-Driven Pico Laser",
  description:
    "Predictable outcomes across every skin type. The Precise System launches August 8, 2026. Get launch updates and demo access.",
  openGraph: {
    title: "Precise Aesthetics — A new standard in laser dermatology",
    description:
      "Predictable outcomes across every skin type. Launching August 8, 2026, Civic Opera Building, Chicago.",
    url: SITE.url,
    siteName: SITE.name,
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Precise Aesthetics — Predictable outcomes across every skin type.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Precise Aesthetics",
    description: "Predictable outcomes across every skin type.",
    images: ["/og"],
  },
  alternates: {
    canonical: SITE.url,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Precise Aesthetics",
  legalName: "PS Medical Aesthetics, LLC",
  url: SITE.url,
  logo: `${SITE.url}/brand/precise-aesthetics-monogram-circle-light-1024.png`,
  description:
    "A clinical technology company building complete dermatologic systems.",
};

export default function HomePage() {
  return (
    <>
      {/* Scoped smooth scroll + reserved scrollbar gutter for the teaser page.
          The gutter prevents the fixed header from shifting when Radix Select
          locks body scroll on open. */}
      <style>{`
        html { scrollbar-gutter: stable; }
        @media (prefers-reduced-motion: no-preference) {
          html { scroll-behavior: smooth; }
        }
      `}</style>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* Section 1 — Hero */}
      <Section tone="midnight-deep" size="hero">
        <div className="max-w-[28ch]">
          <p className="font-body text-overline tracking-overline uppercase text-cream-100/80">
            Launching August 8, 2026 &middot; Civic Opera Building &middot; Chicago
          </p>
          <DisplayHeading level="xl" as="h1" className="mt-8">
            Predictable outcomes across every skin type.
          </DisplayHeading>
        </div>
        <Lead className="mt-8 text-cream-100">
          The Precise System pairs a multi-wavelength pico laser with the
          PIH Prevention Protocol<TrademarkSymbol />, biologic control, and a
          data intelligence layer that refines outcomes over time.
        </Lead>
        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Button asChild variant="primary-on-dark" size="lg">
            <a href="#updates">Get launch updates</a>
          </Button>
          <Button asChild variant="secondary-on-dark" size="lg">
            <Link href="/?interest=launch_event#updates">Request an invitation</Link>
          </Button>
        </div>
      </Section>

      {/* Section 2 — Thesis */}
      <Section tone="bone" size="default" containerWidth="prose" eyebrow="Why the system exists">
        <DisplayHeading level="md" as="h2">
          Built for the patients the industry has historically struggled to treat.
        </DisplayHeading>
        <BodyText className="mt-8">
          Most pico systems were optimized for the easiest cases. The Precise
          System was engineered for Fitzpatrick IV, V, and VI &mdash; where
          post-inflammatory hyperpigmentation, complication risk, and protocol
          inconsistency have made laser dermatology unreliable. We changed
          the inputs. The outcomes followed.
        </BodyText>
      </Section>

      {/* Section 3 — Lead Capture */}
      <Section
        tone="bone"
        size="default"
        id="updates"
        containerWidth="prose"
        eyebrow="Stay informed"
      >
        <Heading level={2}>Get launch updates.</Heading>
        <Lead className="mt-6 text-ink-700">
          For practitioners who want first access to demo scheduling and
          launch event invitations.
        </Lead>
        <div className="mt-10">
          <LeadForm tone="light" />
        </div>
      </Section>

      {/* Section 4 — Launch */}
      <Section
        tone="midnight"
        size="default"
        id="launch"
        eyebrow="By invitation"
      >
        <DisplayHeading level="md" as="h2">
          The Precise System launches August 8, 2026.
        </DisplayHeading>
        <Lead className="mt-8 text-cream-100">
          An evening of clinical demonstrations and conversation at the Civic
          Opera Building, Chicago. Attendance is by invitation only.
        </Lead>
        <div className="mt-10">
          <Button asChild variant="primary-on-dark" size="lg">
            <Link href="/?interest=launch_event#updates">Request an invitation</Link>
          </Button>
        </div>
      </Section>

      {/* Section 5 — Closing */}
      <Section tone="midnight-deep" size="compact" containerWidth="narrow">
        <DisplayHeading level="md" as="p" className="text-center tracking-[0.02em]">
          Skin of every shade.
        </DisplayHeading>
      </Section>
    </>
  );
}
