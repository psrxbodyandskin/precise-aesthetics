import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { PortalShell } from "@/components/portal/PortalShell";

export const metadata: Metadata = {
  title: "Portal — Precise Aesthetics",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Portal dashboard root. Status gate runs here:
//  • pending  → /portal/setup
//  • active   → render dashboard (placeholder until P4–P7 ship the real surfaces)
//  • suspended/archived → bounce to login
//
// The dashboard body is intentionally a stub for P3 — protocol library
// and treatment logging surfaces land in P4 onward.
export default async function PortalIndexPage() {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);

  if (!practice) {
    redirect("/portal/login?error=no_practice");
  }
  if (practice.status === "pending") {
    redirect("/portal/setup");
  }
  if (practice.status === "suspended" || practice.status === "archived") {
    redirect("/portal/login?error=account_inactive");
  }

  return (
    <PortalShell practiceName={practice.name}>
      <article className="mx-auto max-w-[1200px] px-6 pt-12 pb-24 md:px-12 md:pt-16 md:pb-32">
        <div aria-hidden="true" className="mb-8 flex">
          <span className="block h-px w-[60px] bg-brand-500/50" />
        </div>

        <header>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            § Dashboard
          </p>
          <h1
            className="mt-4 font-display text-ink-900"
            style={{
              fontSize: "clamp(2rem, 2.5vw + 1rem, 3rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            Welcome back.
          </h1>
          <p
            className="mt-4 max-w-[58ch] font-body text-ink-700"
            style={{ fontSize: "1rem", lineHeight: 1.65 }}
          >
            The protocol library and treatment logging surfaces here
            as each module ships. Your practice profile and authorized users
            are saved.
          </p>
        </header>

        <section className="mt-16 grid gap-6 sm:grid-cols-2">
          <div className="border-l border-ink-700/15 pl-5">
            <p
              className="font-body text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Next
            </p>
            <p className="mt-3 font-display text-h4 leading-heading text-ink-900">
              Protocol library
            </p>
            <p
              className="mt-2 font-body text-caption text-ink-500"
              style={{ lineHeight: 1.55 }}
            >
              Browse protocols matched to your devices. Coming next.
            </p>
          </div>

          <div className="border-l border-ink-700/15 pl-5">
            <p
              className="font-body text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Soon
            </p>
            <p className="mt-3 font-display text-h4 leading-heading text-ink-900">
              Treatment logging
            </p>
            <p
              className="mt-2 font-body text-caption text-ink-500"
              style={{ lineHeight: 1.55 }}
            >
              Lightweight logging with optional photos and adverse-event flag.
            </p>
          </div>
        </section>
      </article>
    </PortalShell>
  );
}
