import type { Metadata } from "next";
import type { ReactNode } from "react";
import { unstable_cache } from "next/cache";
import { AdminSidebar } from "@/components/admin/shared/AdminSidebar";
import { HelpChatProvider } from "@/components/admin/help/HelpChatProvider";
import { getCurrentUser } from "@/lib/auth/server";
import { countNewAdverseEvents } from "@/lib/admin/adverse-events";
import { getInboxNewCount } from "@/lib/admin/inbox";

const cachedNewAdverseEventsCount = unstable_cache(
  async () => countNewAdverseEvents(),
  ["admin-adverse-events-new-count"],
  { revalidate: 60, tags: ["adverse-events"] },
);

const cachedNewInboxCount = unstable_cache(
  async () => getInboxNewCount(),
  ["admin-inbox-new-count"],
  { revalidate: 60, tags: ["inbox"] },
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

  // Fetch both badge counts in parallel (60s cached each). Surface as
  // numeric badges on the Adverse Events and Inbox sidebar items.
  const [newAdverseEventsCount, newInboxCount] = await Promise.all([
    cachedNewAdverseEventsCount(),
    cachedNewInboxCount(),
  ]);

  return (
    <div className="min-h-screen bg-bone-100">
      <AdminSidebar
        newAdverseEventsCount={newAdverseEventsCount}
        newInboxCount={newInboxCount}
      />
      <main id="main" className="md:ml-[240px]">
        {children}
      </main>
      {/* P13 — help chatbot. Mounts only after the auth gate above
          confirms the user is an admin. Pre-auth pages (login,
          reset-password) get nothing. */}
      <HelpChatProvider />
    </div>
  );
}
