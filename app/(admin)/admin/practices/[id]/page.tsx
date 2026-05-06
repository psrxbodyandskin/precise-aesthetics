import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/server";
import {
  getPracticeById,
  listPracticeDevicesForPractice,
  listPracticeUsersForPractice,
  listAuditLogForPractice,
} from "@/lib/admin/practices";
import {
  getCertificationsForPractice,
  getTrainingProgressForPractice,
} from "@/lib/admin/training";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { PracticeDetailView } from "@/components/admin/practices/PracticeDetailView";
import { PracticeCertificationsPanel } from "@/components/admin/training/PracticeCertificationsPanel";
import { PracticeTrainingProgressPanel } from "@/components/admin/training/PracticeTrainingProgressPanel";
import { DraftEmailModal } from "@/components/admin/ai/DraftEmailModal";

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

  const [practiceRes, devicesRes, usersRes, auditRes, certifications, training] =
    await Promise.all([
      getPracticeById(id),
      listPracticeDevicesForPractice(id),
      listPracticeUsersForPractice(id),
      listAuditLogForPractice(id),
      getCertificationsForPractice(id),
      getTrainingProgressForPractice(id),
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

      {/* P11 — Draft email to the practice */}
      <div className="mb-8 flex justify-end">
        <DraftEmailModal
          recipientContext={[
            `Practice: ${practiceRes.data.name}.`,
            `Primary contact email: ${practiceRes.data.primary_email}.`,
            practiceRes.data.phone ? `Phone: ${practiceRes.data.phone}.` : null,
            practiceRes.data.city || practiceRes.data.state
              ? `Location: ${[practiceRes.data.city, practiceRes.data.state]
                  .filter(Boolean)
                  .join(", ")}.`
              : null,
            `Status: ${practiceRes.data.status}.`,
            (devicesRes.data ?? []).length > 0
              ? `Devices: ${(devicesRes.data ?? [])
                  .map((d) => d.devices?.display_name ?? "device")
                  .join(", ")}.`
              : null,
          ]
            .filter(Boolean)
            .join(" ")}
          recipientEmail={practiceRes.data.primary_email}
          triggerLabel="Draft email to practice"
        />
      </div>

      <PracticeDetailView
        practice={practiceRes.data}
        devices={devicesRes.data ?? []}
        users={usersRes.data ?? []}
        auditLog={auditRes.data ?? []}
      />

      {/* P9 — certifications + training progress */}
      <section className="mt-12">
        <h2
          className="mb-5 font-display text-ink-900"
          style={{
            fontSize: "1.375rem",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            fontWeight: 400,
          }}
        >
          Certifications.
        </h2>
        <PracticeCertificationsPanel
          practiceId={practiceRes.data.id}
          rows={certifications}
        />
      </section>

      <section className="mt-12">
        <h2
          className="mb-5 font-display text-ink-900"
          style={{
            fontSize: "1.375rem",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            fontWeight: 400,
          }}
        >
          Training progress.
        </h2>
        <PracticeTrainingProgressPanel rows={training} />
      </section>
    </div>
  );
}
