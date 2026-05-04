import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/server";
import { listInboxItems } from "@/lib/admin/inbox";
import { parseInboxFiltersFromSearchParams } from "@/lib/admin/inbox-filters";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { InboxFilterBar } from "@/components/admin/inbox/InboxFilterBar";
import { InboxList } from "@/components/admin/inbox/InboxList";
import { InboxPagination } from "@/components/admin/inbox/InboxPagination";
import { EmptyInboxState } from "@/components/admin/inbox/EmptyInboxState";

export const metadata: Metadata = {
  title: "Inbox — Admin",
  robots: { index: false, follow: false },
};

interface InboxPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminInboxPage({ searchParams }: InboxPageProps) {
  await requireAdmin();
  const sp = await searchParams;
  const filters = parseInboxFiltersFromSearchParams(sp);

  const result = await listInboxItems({
    type: filters.type,
    status: filters.status,
    search: filters.search,
    page: filters.page,
    pageSize: 50,
  });

  const filtered =
    filters.type !== "all" ||
    filters.status !== "all" ||
    Boolean(filters.search);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb items={[{ label: "Inbox" }]} />

      <AdminPageHeader
        eyebrow="Admin"
        title="Inbox."
        lead="All inbound from the marketing site. Manage leads, demo requests, and contact messages in one place."
      />

      <div className="mt-10">
        <InboxFilterBar counts={result.counts} />
      </div>

      <div className="mt-6">
        {result.items.length === 0 ? (
          <EmptyInboxState filtered={filtered} />
        ) : (
          <>
            <InboxList items={result.items} />
            <InboxPagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
            />
          </>
        )}
      </div>
    </div>
  );
}
