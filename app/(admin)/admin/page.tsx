import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/server";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

// Admin dashboard placeholder. Real metrics dashboard ships in P7 (admin
// data dashboard). P2 leaves this as a quiet welcome surface that points
// the admin at the Practices module.
export const metadata: Metadata = {
  title: "Admin — Precise Aesthetics",
  robots: { index: false, follow: false },
};

export default async function AdminIndexPage() {
  const user = await requireAdmin();

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminPageHeader
        eyebrow={"Console"}
        title={"Welcome back."}
        lead={`Signed in as ${user.email ?? "—"}. The full dashboard with metrics ships later — for now, head to Practices to provision accounts.`}
      />

      <div className="mt-12">
        <Link
          href="/admin/practices"
          className="inline-flex h-11 items-center rounded-md bg-midnight-800 px-6 font-body font-medium text-cream-50 transition-colors duration-[150ms] hover:bg-midnight-700"
        >
          Go to Practices
        </Link>
      </div>
    </div>
  );
}
