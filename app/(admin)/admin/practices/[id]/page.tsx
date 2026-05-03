import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/server";
import {
  getPracticeById,
  listPracticeDevicesForPractice,
  listPracticeUsersForPractice,
  listAuditLogForPractice,
} from "@/lib/admin/practices";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { PracticeDetailView } from "@/components/admin/practices/PracticeDetailView";

export const metadata: Metadata = {
  title: "Practice",
  robots: { index: false, follow: false },
};

export default async function PracticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [practiceRes, devicesRes, usersRes, auditRes] = await Promise.all([
    getPracticeById(id),
    listPracticeDevicesForPractice(id),
    listPracticeUsersForPractice(id),
    listAuditLogForPractice(id),
  ]);

  if (practiceRes.error || !practiceRes.data) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Practices", href: "/admin/practices" },
          { label: practiceRes.data.name },
        ]}
      />

      <PracticeDetailView
        practice={practiceRes.data}
        devices={devicesRes.data ?? []}
        users={usersRes.data ?? []}
        auditLog={auditRes.data ?? []}
      />
    </div>
  );
}
