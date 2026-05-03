import type { Metadata } from "next";
import { ResetPasswordConfirmForm } from "@/components/auth/ResetPasswordConfirmForm";

// Lands here after the user clicks the password-reset email link.
// Supabase exchanges the recovery token in the URL hash on the client and
// puts the user into a temporary session; the form below sets the new
// password against that session.
export const metadata: Metadata = {
  title: "Set new password — Precise Aesthetics",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default function PortalResetPasswordConfirmPage() {
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
          § New password
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
          Set a new password.
        </h1>
      </header>

      <section className="mt-12">
        <ResetPasswordConfirmForm successRedirect="/portal" />
      </section>
    </article>
  );
}
