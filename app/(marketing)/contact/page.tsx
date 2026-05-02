import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { ContactForm } from "@/components/forms/ContactForm";

// /contact mirrors the editorial register established by /about: bone-100
// surface, oversized Fraunces display, 0.18em literal eyebrow tracking
// (intentional document-register override of --tracking-overline). The page
// is hybrid — short editorial framing followed by a single general contact
// form. No hero, no CTAs in body; the form is the only interactive element.

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Contact — Precise Aesthetics",
  description: "Send a message to the Precise Aesthetics team.",
  alternates: { canonical: `${SITE.url}/contact` },
  openGraph: {
    title: "Contact — Precise Aesthetics",
    description: "Send a message to the Precise Aesthetics team.",
    url: `${SITE.url}/contact`,
    siteName: SITE.name,
    type: "website",
  },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default function ContactPage() {
  return (
    <div className="bg-bone-100 pt-24 md:pt-28">
      <article className="relative mx-auto max-w-[680px] px-6 py-20 md:px-12 md:py-32">
        {/* Fig. 09 annotation — top-right of the document column */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-20 font-body text-overline uppercase text-ink-500 md:right-12 md:top-32"
          style={EYEBROW_TRACKING}
        >
          Fig. 09
        </span>

        {/* Top page hairline */}
        <div
          aria-hidden="true"
          className="mb-16 flex justify-center md:mb-24"
        >
          <span className="block h-px w-[60px] bg-brand-500/50" />
        </div>

        {/* Editorial header */}
        <header>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            § Get in touch
          </p>
          <h1
            className="mt-10 font-display text-ink-900"
            style={{
              fontSize: "clamp(3rem, 5vw + 1rem, 6rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            Reach the team
            <br />
            <span className="italic">behind the system.</span>
          </h1>

          <div
            className="mt-12 font-body text-ink-700 max-w-[58ch]"
            style={{
              fontSize: "clamp(1.0625rem, 0.4vw + 1rem, 1.1875rem)",
              lineHeight: 1.7,
            }}
          >
            <p>
              Use the form below to send a message. Practitioners interested
              in scheduling a demonstration can use the demo page directly.
            </p>
            <p className="mt-6">
              <Link
                href="/demo"
                className="text-brand-700 underline-offset-[3px] decoration-1 transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
              >
                Request a demonstration <span aria-hidden="true">&rarr;</span>
              </Link>
            </p>
          </div>
        </header>

        {/* — Section divider — 60px brand-300/30 per spec — */}
        <div
          aria-hidden="true"
          className="flex items-center justify-center py-12"
        >
          <span className="block h-px w-[60px] bg-brand-300/30" />
        </div>

        {/* The form — narrower than the editorial column per spec */}
        <section className="mx-auto max-w-[640px]">
          <ContactForm />
        </section>

        {/* Footer note */}
        <footer className="mt-16">
          <p
            className="mx-auto font-body text-caption leading-body text-ink-500 max-w-[58ch] text-center"
          >
            This form sends a message to the Precise Aesthetics team. We
            respond as time and content allow. Practitioner inquiries about
            The Precise System are best routed through the demonstration
            request page.
          </p>
        </footer>

        {/* Bottom page hairline */}
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
