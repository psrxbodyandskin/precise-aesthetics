import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordRequestForm } from "@/components/auth/ResetPasswordRequestForm";

export const metadata: Metadata = {
  title: "Reset password — Precise Aesthetics",
  robots: { index: false, follow: true },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default function PortalResetPasswordPage() {
  return (
    <article className="relative mx-auto max-w-[480px] px-6 py-32 md:px-12 md:py-40">
      <div aria-hidden="true" className="mb-16 flex justify-center md:mb-24">
        <span className="block h-px w-[60px] bg-brand-500/50" />
      </div>

      <header>
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          {/* [DRAFT] */}§ Reset password
        </p>
        <h1
          className="mt-10 font-display text-ink-900"
          style={{
            fontSize: "clamp(2rem, 2.5vw + 1rem, 3rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            fontWeight: 400,
          }}
        >
          {/* [DRAFT] */}Request a reset link.
        </h1>
        <p
          className="mt-6 max-w-[44ch] font-body text-ink-700"
          style={{ fontSize: "1.0625rem", lineHeight: 1.6 }}
        >
          {/* [DRAFT] */}Enter your work email. We&rsquo;ll send a one-time
          link to set a new password.
        </p>
      </header>

      <section className="mt-12">
        <ResetPasswordRequestForm
          surface="portal"
          redirectPath="/portal/reset-password/confirm"
        />
      </section>

      <footer className="mt-12">
        <p className="text-caption text-ink-500">
          <Link
            href="/portal/login"
            className="text-brand-700 underline-offset-[3px] decoration-1 transition-colors duration-[150ms] hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
          >
            Back to sign-in
          </Link>
        </p>
      </footer>
    </article>
  );
}
