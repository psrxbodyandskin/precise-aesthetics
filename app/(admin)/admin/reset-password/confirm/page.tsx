import type { Metadata } from "next";
import { ResetPasswordConfirmForm } from "@/components/auth/ResetPasswordConfirmForm";

export const metadata: Metadata = {
  title: "Set new password",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default function AdminResetPasswordConfirmPage() {
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
          {/* [DRAFT] */}§ New password
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
          {/* [DRAFT] */}Set a new password.
        </h1>
      </header>

      <section className="mt-12">
        <ResetPasswordConfirmForm successRedirect="/admin" />
      </section>
    </article>
  );
}
