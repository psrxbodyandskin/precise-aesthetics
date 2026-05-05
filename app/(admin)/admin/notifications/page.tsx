import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/server";
import { listForAdmin } from "@/lib/notifications/queries";
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
} from "@/lib/schemas/notifications";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { NotificationsList } from "@/components/portal/notifications/NotificationsList";
import { NotificationsFilterBar } from "@/components/portal/notifications/NotificationsFilterBar";

export const metadata: Metadata = {
  title: "Notifications — Admin",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminNotificationsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();

  const sp = await searchParams;
  const unreadOnly = sp.unread === "1";
  const rawCats = Array.isArray(sp.category)
    ? sp.category
    : sp.category
      ? [sp.category]
      : [];
  const categories = rawCats.filter((c): c is NotificationCategory =>
    (NOTIFICATION_CATEGORIES as readonly string[]).includes(c),
  );

  const result = await listForAdmin(admin.id, {
    unreadOnly,
    categories,
    pageSize: 50,
  });

  const filtered = unreadOnly || categories.length > 0;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb items={[{ label: "Notifications" }]} />
      <AdminPageHeader
        eyebrow="Admin"
        title="Notifications."
        lead="Inbox alerts, adverse events, training milestones, and other system events."
      />

      <div className="mt-10">
        <NotificationsFilterBar
          basePath="/admin/notifications"
          surface="admin"
        />
      </div>

      <div className="mt-6">
        <NotificationsList
          items={result.items.map((it) => ({
            id: it.id,
            category: it.category,
            title: it.title,
            body: it.body,
            link_path: it.link_path,
            created_at: it.created_at,
            read_at: it.read_at,
          }))}
          surface="admin"
          filtered={filtered}
        />
      </div>
    </div>
  );
}
