import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/server";
import {
  getModuleById,
  listModuleMaterials,
} from "@/lib/admin/training";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { TrainingStatusChip } from "@/components/admin/training/TrainingStatusChip";
import { ModuleEditForm } from "@/components/admin/training/ModuleEditForm";
import { ModuleVideoUploader } from "@/components/admin/training/ModuleVideoUploader";
import { MaterialsManager } from "@/components/admin/training/MaterialsManager";

export const metadata: Metadata = {
  title: "Module — Admin",
  robots: { index: false, follow: false },
};

interface ModulePageProps {
  params: Promise<{ id: string }>;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default async function ModuleDetailPage({ params }: ModulePageProps) {
  await requireAdmin();
  const { id } = await params;

  const moduleRow = await getModuleById(id);
  if (!moduleRow) notFound();
  const materials = await listModuleMaterials(id);

  return (
    <div className="mx-auto max-w-[840px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Training", href: "/admin/training" },
          { label: moduleRow.title },
        ]}
      />

      <header>
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          § Module
        </p>
        <h1
          className="mt-3 font-display text-ink-900"
          style={{
            fontSize: "clamp(1.75rem, 2vw + 1rem, 2.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.015em",
            fontWeight: 400,
          }}
        >
          {moduleRow.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TrainingStatusChip status={moduleRow.status} />
          <span className="font-mono text-caption text-ink-500">
            /{moduleRow.slug}
          </span>
          <span
            className="font-body text-caption text-ink-500"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            Updated {new Date(moduleRow.updated_at).toLocaleDateString()}
          </span>
        </div>
      </header>

      <section className="mt-12">
        <h2
          className="mb-5 font-display text-ink-900"
          style={{
            fontSize: "1.25rem",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            fontWeight: 400,
          }}
        >
          Identity & settings.
        </h2>
        <div className="rounded-md border border-ink-700/15 bg-bone-50 p-6">
          <ModuleEditForm module={moduleRow} />
        </div>
      </section>

      <section className="mt-12">
        <h2
          className="mb-5 font-display text-ink-900"
          style={{
            fontSize: "1.25rem",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            fontWeight: 400,
          }}
        >
          Video.
        </h2>
        <ModuleVideoUploader
          moduleId={moduleRow.id}
          initialVideoStoragePath={moduleRow.video_storage_path}
          initialDurationSeconds={moduleRow.video_duration_seconds}
        />
      </section>

      <section className="mt-12">
        <h2
          className="mb-5 font-display text-ink-900"
          style={{
            fontSize: "1.25rem",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            fontWeight: 400,
          }}
        >
          Materials.
        </h2>
        <MaterialsManager moduleId={moduleRow.id} materials={materials} />
      </section>
    </div>
  );
}
