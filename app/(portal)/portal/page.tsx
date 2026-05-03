import type { Metadata } from "next";
import { requirePractice } from "@/lib/auth/server";

// Placeholder portal landing. Session P3 replaces this with the real
// dashboard / setup-wizard router. Built in P1 only so the post-login
// redirect destination exists and the invite-link callback flow has
// somewhere to land without 404'ing.
export const metadata: Metadata = {
  title: "Portal — Precise Aesthetics",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default async function PortalIndexPage() {
  await requirePractice();

  return (
    <article className="relative mx-auto max-w-[680px] px-6 py-32 md:px-12 md:py-40">
      <div aria-hidden="true" className="mb-16 flex justify-center md:mb-24">
        <span className="block h-px w-[60px] bg-brand-500/50" />
      </div>

      <header>
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          {/* [DRAFT] */}§ Portal
        </p>
        <h1
          className="mt-10 font-display text-ink-900"
          style={{
            fontSize: "clamp(2.25rem, 3vw + 1rem, 3.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            fontWeight: 400,
          }}
        >
          {/* [DRAFT] */}Welcome.
        </h1>
        <p
          className="mt-10 max-w-[58ch] font-body text-ink-700"
          style={{ fontSize: "1.0625rem", lineHeight: 1.7 }}
        >
          {/* [DRAFT] */}Your portal is being prepared. The protocol library,
          treatment logging, and notifications surface here as each module
          ships.
        </p>
      </header>
    </article>
  );
}
