import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { curriculumReorderSchema } from "@/lib/schemas/training";
import { reorderCurriculumModules } from "@/lib/admin/training";
import { logAudit } from "@/lib/admin/audit";
import {
  TRAINING_AUDIT_VERBS,
  TRAINING_AUDIT_TARGET_TYPES,
} from "@/lib/schemas/training";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id: curriculumId } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = curriculumReorderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const result = await reorderCurriculumModules({
    curriculumId,
    moduleIds: parsed.data.moduleIds,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not reorder." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: TRAINING_AUDIT_VERBS.curriculumModuleReordered,
    targetType: TRAINING_AUDIT_TARGET_TYPES.curriculum,
    targetId: curriculumId,
    metadata: { ordered_module_ids: parsed.data.moduleIds },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
