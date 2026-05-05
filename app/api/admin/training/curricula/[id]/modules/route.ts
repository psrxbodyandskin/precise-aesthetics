import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { curriculumAddModuleSchema } from "@/lib/schemas/training";
import { addModuleToCurriculum } from "@/lib/admin/training";
import { logAudit } from "@/lib/admin/audit";
import {
  TRAINING_AUDIT_VERBS,
  TRAINING_AUDIT_TARGET_TYPES,
} from "@/lib/schemas/training";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(
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
  const parsed = curriculumAddModuleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const result = await addModuleToCurriculum({
    curriculumId,
    moduleId: parsed.data.moduleId,
    isRequired: parsed.data.isRequired,
  });
  if (!result.id) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not add module." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: TRAINING_AUDIT_VERBS.curriculumModuleAdded,
    targetType: TRAINING_AUDIT_TARGET_TYPES.curriculum,
    targetId: curriculumId,
    metadata: { module_id: parsed.data.moduleId },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true, id: result.id });
}
