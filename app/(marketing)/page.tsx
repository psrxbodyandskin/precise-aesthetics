import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/marketing/Section";
import { BoneBlooms } from "@/components/marketing/BoneBlooms";
import { ConvergenceHeroLoader } from "@/components/marketing/hero-3d/ConvergenceHeroLoader";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Heading } from "@/components/marketing/typography/Heading";
import { Lead } from "@/components/marketing/typography/Lead";
import { BodyText } from "@/components/marketing/typography/BodyText";
import { TrademarkSymbol } from "@/components/marketing/typography/TrademarkSymbol";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/forms/LeadForm";
import { FourPillars } from "@/components/marketing/sections/FourPillars";
import { Outcomes } from "@/components/marketing/sections/Outcomes";
import { ForPractitioners } from "@/components/marketing/sections/ForPractitioners";
import { LaunchSection } from "@/components/marketing/sections/LaunchSection";
import { DemoCta } from "@/components/marketing/sections/DemoCta";
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
                <Link href="/demo">Request a demonstration</Link>
              </Button>
              <Button asChild variant="secondary-on-dark" size="lg">
                <a href="#updates">Get launch updates</a>
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
                className="pointer-events-none absolute bottom-16 -left-2 h-3 w-px bg-brand-300/20"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-16 -left-2 h-px w-3 bg-brand-300/20"
              />
              {/* Bottom-right small bracket */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-16 -right-2 h-3 w-px bg-brand-300/20"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-16 -right-2 h-px w-3 bg-brand-300/20"
              />
              {/* Editorial caption mark */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[42px] right-0 font-body text-[10px] tracking-[0.24em] uppercase text-ink-300"
              >
                Fig. 01
              </span>

              <div className="md:-translate-y-16">
                <ConvergenceHeroLoader />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Section 2 — Thesis. Editorial, anchoring. The "why this exists" moment.
          Plate number + asymmetric brackets establish the editorial rhythm
          carried throughout the page. */}
      <Section
        tone="bone"
        size="default"
        className="relative isolate overflow-hidden"
      >
        <BoneBlooms variant="thesis" />

        {/* Editorial plate header — section starter */}
        <div className="relative flex items-center gap-3">
          <span
            aria-hidden="true"
            className="block h-px w-[60px] bg-brand-500"
          />
          <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-700">
            § Why the system exists
          </p>
        </div>

        {/* 2-up magazine spread — pull quote on left, body on right */}
        <div className="relative mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left column — pull quote with vertical hairline accent */}
          <div className="lg:col-span-6">
            <div className="relative pl-6 md:pl-10">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-2 bottom-2 w-px bg-ink-900/40"
              />
              <p className="font-display italic leading-tight text-ink-900 text-[clamp(2.25rem,4vw+1rem,4rem)] tracking-display">
                We changed the inputs. The outcomes followed.
              </p>
              <span
                aria-hidden="true"
                className="mt-8 block h-px w-[40px] bg-ink-700/40"
              />
              <p className="mt-4 font-body text-caption uppercase tracking-overline text-ink-500">
                The Precise System<TrademarkSymbol />
              </p>
            </div>
          </div>

          {/* Right column — heading + lead with drop cap */}
          <div className="lg:col-span-6">
            <DisplayHeading level="md" as="h2" className="max-w-[18ch]">
              Built for the patients the industry has historically struggled to treat.
            </DisplayHeading>
            <p className="mt-8 font-body text-body leading-body text-ink-700 max-w-[58ch] first-letter:font-display first-letter:italic first-letter:text-[3.5em] first-letter:font-medium first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:leading-[0.8] first-letter:text-ink-900">
              Most pico systems were optimized for the easiest cases. The Precise
              System<TrademarkSymbol /> was engineered for Fitzpatrick I&ndash;VI
              &mdash; where post-inflammatory hyperpigmentation, complication
              risk, and protocol inconsistency have made laser dermatology
              unreliable.
            </p>
          </div>
        </div>
      </Section>

      {/* Section 3 — The Four Pillars. Premium, technical, dense.
          Header + four alternating left/right blocks separated by hairline dividers. */}
      <FourPillars />

      {/* Section 4 — Outcomes. Bone, evidence-led. */}
      <Outcomes />

      {/* Section 5 — For Practitioners. Two-column on desktop. */}
      <ForPractitioners />

      {/* Section 6 — Launch. Champagne sanctioned moment. */}
      <LaunchSection />

      {/* Section 7 — Demo CTA. Direct, action-oriented close. */}
      <DemoCta />

      {/* Lead capture (kept functional under hero secondary CTA). #updates anchor. */}
      <Section
        tone="bone"
        size="compact"
        id="updates"
        containerWidth="prose"
        className="relative isolate overflow-hidden"
      >
        <BoneBlooms variant="lead" />
        <div className="relative border-t border-[color:var(--pa-border-strong)] pt-16">
          <Heading level={3} as="h2">
            Get launch updates.
          </Heading>
          <Lead className="mt-4 text-ink-700">
            For practitioners who want first access to demo scheduling and launch event invitations.
          </Lead>
          <div className="mt-8">
            <LeadForm tone="light" />
          </div>
        </div>
      </Section>
    </>
  );
}
