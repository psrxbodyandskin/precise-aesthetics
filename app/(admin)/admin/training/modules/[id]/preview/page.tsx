import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { requireAdmin } from "@/lib/auth/server";
import { getModuleById, listModuleMaterials } from "@/lib/admin/training";
import { signTrainingObjectUrl } from "@/lib/portal/training";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { TrainingStatusChip } from "@/components/admin/training/TrainingStatusChip";

export const metadata: Metadata = {
  title: "Preview module — Admin",
  robots: { index: false, follow: false },
};

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Admin-side preview of a training module. Renders the video the
// practitioner will watch, plus the title / description / materials
// list — all read-only. Distinct from /admin/training/modules/[id],
// which is the edit form.
//
// Uses a plain <video> tag (not the portal VideoPlayer) — admin
// preview doesn't need progress tracking, just playback.
export default async function ModulePreviewPage({ params }: PreviewPageProps) {
  await requireAdmin();
  const { id } = await params;

  const moduleRow = await getModuleById(id);
  if (!moduleRow) notFound();
  const materials = await listModuleMaterials(id);

  const videoUrl = moduleRow.video_storage_path
    ? await signTrainingObjectUrl({
        bucket: "training-videos",
        storagePath: moduleRow.video_storage_path,
        expiresInSeconds: 60 * 60,
      })
    : null;

  const materialsWithUrls = await Promise.all(
    materials.map(async (m) => ({
      ...m,
      signedUrl: await signTrainingObjectUrl({
        bucket: "training-materials",
        storagePath: m.storage_path,
        expiresInSeconds: 60 * 60,
      }),
    })),
  );

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Training", href: "/admin/training" },
          { label: moduleRow.title },
        ]}
      />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            § Preview
          </p>
          <h1
            className="mt-3 font-display text-ink-900"
            style={{
              fontSize: "clamp(1.5rem, 1.5vw + 1rem, 2.25rem)",
              lineHeight: 1.1,
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
          </div>
        </div>

        <Link
          href={`/admin/training/modules/${moduleRow.id}`}
          className="inline-flex h-10 items-center gap-1.5 rounded-sm border border-ink-700/20 bg-bone-50 px-4 font-body text-small font-medium text-ink-700 transition-colors duration-[150ms] hover:border-ink-700/35 hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
        >
          <Pencil className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          Edit module
        </Link>
      </header>

      {/* Video — plain HTML5 player, no progress tracking */}
      <section className="mt-8">
        {videoUrl ? (
          <div className="overflow-hidden rounded-md border border-ink-700/15 bg-black">
            <video
              src={videoUrl}
              controls
              playsInline
              preload="metadata"
              className="block w-full"
            />
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 p-8 text-center">
            <p className="font-body text-caption text-ink-500">
              No video uploaded for this module.
            </p>
          </div>
        )}
      </section>

      {/* Description */}
      {moduleRow.description && (
        <section className="mt-8">
          <h2
            className="mb-3 font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Description
          </h2>
          <p
            className="font-body text-ink-900"
            style={{ lineHeight: 1.65 }}
          >
            {moduleRow.description}
          </p>
        </section>
      )}

      {/* Materials */}
      {materialsWithUrls.length > 0 && (
        <section className="mt-8">
          <h2
            className="mb-3 font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Materials
          </h2>
          <ul className="space-y-2">
            {materialsWithUrls.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-md border border-ink-700/15 bg-bone-50 px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body text-small font-medium text-ink-900 truncate">
                    {m.title}
                  </p>
                  <p className="font-body text-caption text-ink-500 truncate">
                    {m.filename} · {(m.byte_size / 1024).toFixed(0)} KB
                  </p>
                </div>
                {m.signedUrl && (
                  <a
                    href={m.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={m.filename}
                    className="font-body text-caption text-brand-700 underline-offset-2 hover:underline"
                  >
                    Download
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Settings summary */}
      <section className="mt-8 rounded-md border border-ink-700/15 bg-bone-50 p-5">
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          Module settings
        </p>
        <dl className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="font-body text-caption text-ink-500">
              Required watch
            </dt>
            <dd
              className="mt-1 font-body text-ink-900"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {moduleRow.required_watch_percentage}%
            </dd>
          </div>
          <div>
            <dt className="font-body text-caption text-ink-500">
              Video duration
            </dt>
            <dd
              className="mt-1 font-body text-ink-900"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {moduleRow.video_duration_seconds
                ? formatDuration(moduleRow.video_duration_seconds)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-body text-caption text-ink-500">Updated</dt>
            <dd
              className="mt-1 font-body text-ink-900"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {new Date(moduleRow.updated_at).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}
