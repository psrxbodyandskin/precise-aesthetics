import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";

// Admin sign-in surface. Hidden from indexing (per ambiguity F: no public
// link, noindex). Email + password only — no magic link on the admin
// surface to reduce phishable surface area for privileged accounts.
export const metadata: Metadata = {
  title: "Admin sign-in",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === "admin") redirect("/admin");
  if (user?.role === "practice") redirect("/portal");

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
          {/* [DRAFT] */}§ Internal sign-in
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
          {/* [DRAFT] */}Sign in.
        </h1>
        <p
          className="mt-6 max-w-[44ch] font-body text-ink-700"
          style={{ fontSize: "1.0625rem", lineHeight: 1.6 }}
        >
          {/* [DRAFT] */}Internal team only.
        </p>
      </header>

      <section className="mt-12">
        <AdminLoginForm />
      </section>

      <footer className="mt-12">
        <p className="text-caption text-ink-500">
          {/* [DRAFT] */}Forgot your password?{" "}
          <Link
            href="/admin/reset-password"
            className="text-brand-700 underline-offset-[3px] decoration-1 transition-colors duration-[150ms] hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
          >
            Request a reset link
          </Link>
          .
        </p>
      </footer>
    </article>
  );
}
