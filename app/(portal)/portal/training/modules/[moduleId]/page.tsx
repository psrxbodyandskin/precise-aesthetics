import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import {
  getModuleForPractice,
  signTrainingObjectUrl,
} from "@/lib/portal/training";
import { PortalShell } from "@/components/portal/PortalShell";
import { VideoPlayer } from "@/components/portal/training/VideoPlayer";
import { ModuleMaterials } from "@/components/portal/training/ModuleMaterials";
import { ModuleCompletionPanel } from "@/components/portal/training/ModuleCompletionPanel";

export const metadata: Metadata = {
  title: "Training module — Precise Aesthetics",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface ModulePageProps {
  params: Promise<{ moduleId: string }>;
}

export default async function PortalModulePage({ params }: ModulePageProps) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) redirect("/portal/login?error=no_practice");
  if (practice.status === "pending") redirect("/portal/setup");
  if (practice.status === "suspended" || practice.status === "archived") {
    redirect("/portal/login?error=account_inactive");
  }

  const { moduleId } = await params;

  const detail = await getModuleForPractice({
    moduleId,
    practiceId: practice.id,
    practiceUserId: null,
  });
  if (!detail) notFound();

  // Sign URLs (server-rendered; refresh page if expired)
  const videoUrl = detail.module.video_storage_path
    ? await signTrainingObjectUrl({
        bucket: "training-videos",
        storagePath: detail.module.video_storage_path,
        expiresInSeconds: 60 * 60,
      })
    : null;

  const materialsWithUrls = await Promise.all(
    detail.materials.map(async (m) => ({
      id: m.id,
      title: m.title,
      filename: m.filename,
      byte_size: m.byte_size,
      signedUrl: await signTrainingObjectUrl({
        bucket: "training-materials",
        storagePath: m.storage_path,
        expiresInSeconds: 60 * 60,
      }),
    })),
  );

  // Resolve practice_authorized_users.id for the current auth user
  // (matches treatment-logging entered_by_user_id pattern). Falls back
  // to null if no roster row — completion buttons will toast a warning.
  // Skipping inline lookup for v1; ack/cert components handle null
  // gracefully and surface a clear toast. The user picker (P6 pattern)
  // is the canonical attribution surface.
  const practiceUserId: string | null = null;
  void user;

  const watchPercent = detail.progress?.watch_percentage ?? 0;
  const watchUnlocked = watchPercent >= detail.module.required_watch_percentage;

  return (
    <PortalShell practiceName={practice.name}>
      <article className="mx-auto max-w-[900px] px-6 pt-12 pb-24 md:px-12 md:pt-16 md:pb-32">
        <p
          className="mb-3 font-body text-caption text-ink-500"
          style={{ letterSpacing: "0.04em" }}
        >
          <Link
            href={`/portal/training/${detail.curriculum?.id ?? ""}`}
            className="hover:text-ink-900 underline-offset-2 hover:underline"
          >
            ← {detail.curriculum?.title ?? "Curriculum"}
          </Link>
        </p>

        <header>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Module
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
            {detail.module.title}
          </h1>
          {detail.module.description && (
            <p
              className="mt-3 max-w-[58ch] font-body text-ink-700"
              style={{ lineHeight: 1.65 }}
            >
              {detail.module.description}
            </p>
          )}
        </header>

        {/* Video */}
        <section className="mt-8">
          {videoUrl ? (
            <VideoPlayer
              videoUrl={videoUrl}
              moduleId={detail.module.id}
              practiceUserId={practiceUserId ?? ""}
              initialPositionSeconds={detail.progress?.last_position_seconds ?? 0}
              initialWatchPercentage={watchPercent}
              durationSeconds={detail.module.video_duration_seconds}
              requiredWatchPercentage={detail.module.required_watch_percentage}
              onWatchComplete={() => {}}
            />
          ) : (
            <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 p-8 text-center">
              <p className="font-body text-caption text-ink-500">
                Video not yet uploaded.
              </p>
            </div>
          )}
        </section>

        {/* Completion */}
        <div className="mt-8">
          <ModuleCompletionPanel
            moduleId={detail.module.id}
            practiceUserId={practiceUserId}
            watchPercentage={watchPercent}
            requiredWatchPercentage={detail.module.required_watch_percentage}
            isComplete={Boolean(detail.progress?.is_complete)}
            watchUnlocked={watchUnlocked}
          />
        </div>

        {/* Materials */}
        {materialsWithUrls.length > 0 && (
          <div className="mt-8">
            <ModuleMaterials materials={materialsWithUrls} />
          </div>
        )}
      </article>
    </PortalShell>
  );
}
