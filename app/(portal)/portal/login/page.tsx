import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { PortalLoginForm } from "@/components/auth/PortalLoginForm";
import { BoneBlooms } from "@/components/marketing/BoneBlooms";

// Portal sign-in surface. Single page, two methods (email+password OR
// magic link), per ambiguity B. Already-signed-in practitioners are
// bounced to /portal; admins to /admin (strict separation).
export const metadata: Metadata = {
  title: "Sign in — Precise Aesthetics",
  // Login page is publicly reachable but de-prioritized for indexing —
  // not strictly hidden because the portal's existence is implied by
  // marketing copy (Practitioners CTA), but no SEO value to indexing.
  robots: { index: false, follow: true },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default async function PortalLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === "practice") redirect("/portal");
  if (user?.role === "admin") redirect("/admin");

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <BoneBlooms variant="lead" />
      <article className="relative mx-auto max-w-[480px] px-6 pt-8 pb-12 md:px-12 md:pt-10 md:pb-16">
        <div aria-hidden="true" className="mb-6 flex justify-center md:mb-8">
          <span className="block h-px w-[60px] bg-brand-500/50" />
        </div>

        <header>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            {/* [DRAFT] */}§ Practitioner sign-in
          </p>
          <h1
            className="mt-4 font-display text-ink-900"
            style={{
              fontSize: "clamp(1.75rem, 2vw + 1rem, 2.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            {/* [DRAFT] */}Sign in.
          </h1>
          <p
            className="mt-3 max-w-[44ch] font-body text-ink-700"
            style={{ fontSize: "0.9375rem", lineHeight: 1.5 }}
          >
            {/* [DRAFT] */}Use your email and password, or request a one-time
            sign-in link.
          </p>
        </header>

        <section className="mt-6">
          <PortalLoginForm />
        </section>

        <footer className="mt-6">
          <p className="text-caption text-ink-500">
            {/* [DRAFT] */}Forgot your password?{" "}
            <Link
              href="/portal/reset-password"
              className="text-brand-700 underline-offset-[3px] decoration-1 transition-colors duration-[150ms] hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
            >
              Request a reset link
            </Link>
            .
          </p>
          <p className="mt-2 text-caption text-ink-500">
            {/* [DRAFT] */}Account access is provisioned by Precise Aesthetics
            and arrives via email invite.
          </p>
        </footer>
      </article>
    </div>
  );
}
