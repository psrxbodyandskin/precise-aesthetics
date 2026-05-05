import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { curriculumUpdateSchema } from "@/lib/schemas/training";
import {
  getCurriculumById,
  updateCurriculum,
} from "@/lib/admin/training";
import { logAudit } from "@/lib/admin/audit";
import {
  TRAINING_AUDIT_VERBS,
  TRAINING_AUDIT_TARGET_TYPES,
} from "@/lib/schemas/training";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const curriculum = await getCurriculumById(id);
  if (!curriculum) {
    return NextResponse.json(
      { ok: false, error: "Curriculum not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, curriculum });
}

export async function PATCH(
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

  const parsed = curriculumUpdateSchema.safeParse(json);
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

  const before = await getCurriculumById(id);
  if (!before) {
    return NextResponse.json(
      { ok: false, error: "Curriculum not found." },
      { status: 404 },
    );
  }

  const result = await updateCurriculum(id, {
    title: parsed.data.title,
    description:
      parsed.data.description === undefined
        ? undefined
        : parsed.data.description || null,
    status: parsed.data.status,
    lastUpdatedBy: admin.id,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not update." },
      { status: 500 },
    );
  }

  // Audit status flips with specific verbs
  if (parsed.data.status && parsed.data.status !== before.status) {
    let verb: string;
    if (parsed.data.status === "published") verb = TRAINING_AUDIT_VERBS.curriculumPublished;
    else if (parsed.data.status === "archived")
      verb = TRAINING_AUDIT_VERBS.curriculumArchived;
    else verb = TRAINING_AUDIT_VERBS.curriculumUnpublished;

    await logAudit({
      actorId: admin.id,
      actorRole: "admin",
      action: verb,
      targetType: TRAINING_AUDIT_TARGET_TYPES.curriculum,
      targetId: id,
      metadata: {
        from: before.status,
        to: parsed.data.status,
      },
      ipAddress: getClientIp(req.headers),
    });
  }

  return NextResponse.json({ ok: true });
}
