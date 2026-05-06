import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/server";
import {
  getAuditLogEntryById,
  getRelatedEntriesForTarget,
} from "@/lib/admin/audit-log";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AuditLogDetailView } from "@/components/admin/audit-log/AuditLogDetailView";

export const metadata: Metadata = {
  title: "Audit entry — Admin",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAuditLogDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const entry = await getAuditLogEntryById(id);
  if (!entry) notFound();

  const related =
    entry.targetType && entry.targetId
      ? await getRelatedEntriesForTarget(entry.targetType, entry.targetId, 11)
      : [];

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Audit log", href: "/admin/audit-log" },
          { label: entry.action },
        ]}
      />
      <div className="mt-8">
        <AuditLogDetailView entry={entry} related={related} />
      </div>
    </div>
  );
}
