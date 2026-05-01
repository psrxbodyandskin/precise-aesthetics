import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/marketing/Section";
import { ConvergenceHeroLoader } from "@/components/marketing/hero-3d/ConvergenceHeroLoader";
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

      {/* Section 1 — Hero. Background swapped from solid midnight-800 to a
          subtle radial gradient (midnight-700 center → midnight-800 edges) so
          the dark surface has depth instead of reading flat. */}
      <Section
        tone="midnight-deep"
        size="hero"
        className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_55%_70%_at_50%_45%,_#1F2F4F_0%,_#0C1426_72%)]"
      >
        {/* Film-grain noise overlay — atmosphere on midnight surface */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
            backgroundSize: "160px 160px",
          }}
        />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:items-start">
          <div>
            <div>
              <p className="font-body text-overline tracking-overline uppercase text-cream-100/80">
                Launching August 8, 2026 &middot; Civic Opera Building &middot; Chicago
              </p>
              <DisplayHeading level="xl" as="h1" className="mt-8 max-w-[22ch]">
                Predictable outcomes across every skin type.
              </DisplayHeading>
            </div>
            <Lead className="mt-8 text-cream-100">
              The Precise System<TrademarkSymbol /> pairs a multi-wavelength pico laser with the
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
          </div>

          <div className="lg:justify-self-end w-full lg:-mt-[5px]">
            {/* Exhibit label — eyebrow + caption above the 3D scene. */}
            <div className="mb-5 px-1">
              <span className="font-body text-overline tracking-overline uppercase text-brand-300">
                The Precise System<TrademarkSymbol />
              </span>
              <p className="mt-2 font-body text-[13px] leading-snug text-ink-300">
                A closed-loop clinical architecture.
              </p>
            </div>

            {/* Editorial framing — asymmetric, NOT a full border. */}
            <div className="relative w-full max-w-[620px] mx-auto">
              {/* Top-left hairline L (80×80) */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 -left-2 h-[80px] w-px bg-brand-300/20"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 -left-2 h-px w-[80px] bg-brand-300/20"
              />
              {/* Top-right small bracket (12×12) */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 -right-2 h-3 w-px bg-brand-300/20"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 -right-2 h-px w-3 bg-brand-300/20"
              />
              {/* Bottom-left small bracket */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-32 -left-2 h-3 w-px bg-brand-300/20"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-32 -left-2 h-px w-3 bg-brand-300/20"
              />
              {/* Bottom-right small bracket */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-32 -right-2 h-3 w-px bg-brand-300/20"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-32 -right-2 h-px w-3 bg-brand-300/20"
              />
              {/* Editorial caption mark */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[106px] right-0 font-body text-[10px] tracking-[0.24em] uppercase text-ink-300"
              >
                Fig. 01
              </span>

              <div className="-translate-y-16">
                <ConvergenceHeroLoader />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Section 2 — Thesis */}
      <Section
        tone="bone"
        size="default"
        containerWidth="prose"
        eyebrow="Why the system exists"
        className="md:pb-16"
      >
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
        className="md:pt-16"
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
