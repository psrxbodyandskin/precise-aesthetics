import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { removeModuleFromCurriculum } from "@/lib/admin/training";
import { logAudit } from "@/lib/admin/audit";
import {
  TRAINING_AUDIT_VERBS,
  TRAINING_AUDIT_TARGET_TYPES,
} from "@/lib/schemas/training";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> },
) {
  const admin = await requireAdmin();
  const { id: curriculumId, moduleId } = await params;

  const result = await removeModuleFromCurriculum({ curriculumId, moduleId });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not remove module." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: TRAINING_AUDIT_VERBS.curriculumModuleRemoved,
    targetType: TRAINING_AUDIT_TARGET_TYPES.curriculum,
    targetId: curriculumId,
    metadata: { module_id: moduleId },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
