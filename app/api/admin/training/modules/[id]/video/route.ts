import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { moduleVideoSchema } from "@/lib/schemas/training";
import { getModuleById, updateModule } from "@/lib/admin/training";
import { logAudit } from "@/lib/admin/audit";
import {
  TRAINING_AUDIT_VERBS,
  TRAINING_AUDIT_TARGET_TYPES,
} from "@/lib/schemas/training";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST /api/admin/training/modules/[id]/video
//
// Called AFTER the admin client has uploaded the video file directly
// to Supabase Storage's training-videos bucket via the Supabase JS
// client (using their session token; bucket RLS verifies is_admin).
// This endpoint just records the storage path + duration that the
// client extracted from the file's metadata. No file proxying — the
// 5GB cap on Vercel body size makes that impossible.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = moduleVideoSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid submission",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const before = await getModuleById(id);
  if (!before) {
    return NextResponse.json(
      { ok: false, error: "Module not found." },
      { status: 404 },
    );
  }

  const result = await updateModule(id, {
    videoStoragePath: parsed.data.storagePath,
    videoDurationSeconds: parsed.data.durationSeconds ?? null,
    videoThumbnailPath: parsed.data.thumbnailStoragePath ?? null,
    lastUpdatedBy: admin.id,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not save video." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: TRAINING_AUDIT_VERBS.moduleVideoUploaded,
    targetType: TRAINING_AUDIT_TARGET_TYPES.module,
    targetId: id,
    metadata: {
      storage_path: parsed.data.storagePath,
      duration_seconds: parsed.data.durationSeconds ?? null,
    },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
