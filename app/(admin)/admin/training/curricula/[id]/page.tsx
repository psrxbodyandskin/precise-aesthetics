import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/server";
import {
  getCurriculumById,
  getCurriculumCertStats,
} from "@/lib/admin/training";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { TrainingStatusChip } from "@/components/admin/training/TrainingStatusChip";
import { ModuleOrderingList } from "@/components/admin/training/ModuleOrderingList";
import { AddModulePicker } from "@/components/admin/training/AddModulePicker";
import { CertificationStatsPanel } from "@/components/admin/training/CertificationStatsPanel";
import { CurriculumActions } from "@/components/admin/training/CurriculumActions";

export const metadata: Metadata = {
  title: "Curriculum — Admin",
  robots: { index: false, follow: false },
};

interface CurriculumPageProps {
  params: Promise<{ id: string }>;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default async function CurriculumDetailPage({
  params,
}: CurriculumPageProps) {
  await requireAdmin();
  const { id } = await params;

  const curriculum = await getCurriculumById(id);
  if (!curriculum) notFound();

  const stats = await getCurriculumCertStats(id);

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Training", href: "/admin/training" },
          {
            label: `${curriculum.device?.display_name ?? "Device"} curriculum`,
          },
        ]}
      />

      <header className="space-y-4">
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          § {curriculum.device?.display_name ?? "Device"}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="font-display text-ink-900"
              style={{
                fontSize: "clamp(1.75rem, 2vw + 1rem, 2.5rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.015em",
                fontWeight: 400,
              }}
            >
              {curriculum.title}
            </h1>
            {curriculum.description && (
              <p
                className="mt-3 font-body text-ink-700"
                style={{ lineHeight: 1.65 }}
              >
                {curriculum.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <TrainingStatusChip status={curriculum.status} />
              <span
                className="font-body text-caption text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                Updated {new Date(curriculum.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <CurriculumActions
            curriculumId={curriculum.id}
            status={curriculum.status}
          />
        </div>
      </header>

      <section className="mt-12">
        <CertificationStatsPanel stats={stats} />
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="font-display text-ink-900"
            style={{
              fontSize: "1.375rem",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              fontWeight: 400,
            }}
          >
            Modules.
          </h2>
          <AddModulePicker
            curriculumId={curriculum.id}
            attachedModuleIds={curriculum.modules.map((m) => m.module.id)}
          />
        </div>
        <ModuleOrderingList
          curriculumId={curriculum.id}
          modules={curriculum.modules}
        />
      </section>
    </div>
  );
}
