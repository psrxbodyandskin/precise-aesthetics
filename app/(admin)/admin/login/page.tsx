import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { BoneBlooms } from "@/components/marketing/BoneBlooms";

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
            § Internal sign-in
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
            Sign in.
          </h1>
          <p
            className="mt-3 max-w-[44ch] font-body text-ink-700"
            style={{ fontSize: "0.9375rem", lineHeight: 1.5 }}
          >
            Internal team only.
          </p>
        </header>

        <section className="mt-6">
          <AdminLoginForm />
        </section>

        <footer className="mt-6">
          <p className="text-caption text-ink-500">
            Forgot your password?{" "}
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
    </div>
  );
}
