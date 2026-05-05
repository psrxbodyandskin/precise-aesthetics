import { NextResponse, type NextRequest } from "next/server";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import {
  getModuleForPractice,
  signTrainingObjectUrl,
} from "@/lib/portal/training";

export const runtime = "nodejs";

// GET /api/portal/training/modules/[id]
//
// Returns the module + materials + own progress + a short-lived
// signed URL for the video (and per-material signed URLs).
// The portal client uses these URLs directly with <video> + <a download>.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) {
    return NextResponse.json(
      { ok: false, error: "Practice record not found." },
      { status: 404 },
    );
  }
  const { id } = await params;

  const detail = await getModuleForPractice({
    moduleId: id,
    practiceId: practice.id,
    practiceUserId: null,
  });
  if (!detail) {
    return NextResponse.json(
      { ok: false, error: "Module unavailable." },
      { status: 404 },
    );
  }

  // Sign URLs (1h TTL — long enough for a single-session watch)
  let videoUrl: string | null = null;
  if (detail.module.video_storage_path) {
    videoUrl = await signTrainingObjectUrl({
      bucket: "training-videos",
      storagePath: detail.module.video_storage_path,
      expiresInSeconds: 60 * 60,
    });
  }

  const materialsWithUrls = await Promise.all(
    detail.materials.map(async (m) => ({
      ...m,
      signedUrl: await signTrainingObjectUrl({
        bucket: "training-materials",
        storagePath: m.storage_path,
        expiresInSeconds: 60 * 60,
      }),
    })),
  );

  return NextResponse.json({
    ok: true,
    module: detail.module,
    curriculum: detail.curriculum,
    materials: materialsWithUrls,
    progress: detail.progress,
    videoUrl,
  });
}
