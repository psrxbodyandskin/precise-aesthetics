import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { curriculumCreateSchema } from "@/lib/schemas/training";
import {
  createCurriculum,
  listAllCurricula,
} from "@/lib/admin/training";
import { logAudit } from "@/lib/admin/audit";
import { TRAINING_AUDIT_VERBS, TRAINING_AUDIT_TARGET_TYPES } from "@/lib/schemas/training";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  await requireAdmin();
  const curricula = await listAllCurricula();
  return NextResponse.json({ ok: true, curricula });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = curriculumCreateSchema.safeParse(json);
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

  const result = await createCurriculum({
    deviceId: parsed.data.deviceId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    createdBy: admin.id,
  });
  if (!result.id) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not create curriculum." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: TRAINING_AUDIT_VERBS.curriculumCreated,
    targetType: TRAINING_AUDIT_TARGET_TYPES.curriculum,
    targetId: result.id,
    metadata: {
      device_id: parsed.data.deviceId,
      title: parsed.data.title,
    },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true, id: result.id });
}
