import type { Metadata } from "next";
import type { ReactNode } from "react";
import { unstable_cache } from "next/cache";
import { AdminSidebar } from "@/components/admin/shared/AdminSidebar";
import { getCurrentUser } from "@/lib/auth/server";
import { countNewAdverseEvents } from "@/lib/admin/adverse-events";

const cachedNewAdverseEventsCount = unstable_cache(
  async () => countNewAdverseEvents(),
  ["admin-adverse-events-new-count"],
  { revalidate: 60, tags: ["adverse-events"] },
);

// /admin/* route group root layout. Internal team only. Hidden from search
// engines via metadata-level robots noindex.
//
// Sidebar renders only when the current user is authenticated as an admin
// (i.e. they're past login). Login + reset-password pages render without
// the sidebar because there's no admin session yet — clean by construction,
// no path allowlist to maintain.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const showSidebar = user?.role === "admin";

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-bone-100">
        <main id="main">{children}</main>
      </div>
    );
  }

  // Fetch the new-adverse-events count once per layout render (60s
  // cache via unstable_cache). Surfaces as a badge on the sidebar nav
  // for the Adverse Events item.
  const newAdverseEventsCount = await cachedNewAdverseEventsCount();

  return (
    <div className="min-h-screen bg-bone-100">
      <AdminSidebar newAdverseEventsCount={newAdverseEventsCount} />
      <main id="main" className="md:ml-[240px]">
        {children}
      </main>
    </div>
  );
}
