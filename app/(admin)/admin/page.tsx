import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/server";

// Placeholder admin landing. Real admin dashboard is built incrementally
// across P2 (provisioning) → P11 (AI agents). P1 just needs a destination
// so logged-in admins don't 404.
export const metadata: Metadata = {
  title: "Admin — Precise Aesthetics",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default async function AdminIndexPage() {
  const user = await requireAdmin();

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
          {/* [DRAFT] */}§ Admin
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
          {/* [DRAFT] */}Internal console.
        </h1>
        <p
          className="mt-10 max-w-[58ch] font-body text-ink-700"
          style={{ fontSize: "1.0625rem", lineHeight: 1.7 }}
        >
          {/* [DRAFT] */}Signed in as <span className="text-ink-900">{user.email ?? "—"}</span>.
          Practice provisioning, the lead inbox, and AI agents land in
          subsequent sessions.
        </p>
      </header>
    </article>
  );
}
