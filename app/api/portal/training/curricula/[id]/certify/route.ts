import { NextResponse, type NextRequest } from "next/server";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { certifyCurriculum } from "@/lib/portal/training";
import { certifyCurriculumSchema } from "@/lib/schemas/training";
import { logAudit } from "@/lib/admin/audit";
import {
  TRAINING_AUDIT_VERBS,
  TRAINING_AUDIT_TARGET_TYPES,
} from "@/lib/schemas/training";
import { getClientIp } from "@/lib/rate-limit";
import { dispatchToAdmins } from "@/lib/notifications/dispatch";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
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
  const parsed = certifyCurriculumSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const result = await certifyCurriculum({
    practiceId: practice.id,
    practiceUserId: parsed.data.certifiedByUserId,
    curriculumId,
  });
  if (!result.ok || !result.certification) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not certify." },
      { status: 400 },
    );
  }

  await logAudit({
    actorId: user.id,
    actorRole: "practice",
    action: TRAINING_AUDIT_VERBS.certificationGranted,
    targetType: TRAINING_AUDIT_TARGET_TYPES.certification,
    targetId: result.certification.id,
    metadata: {
      practice_id: practice.id,
      device_id: result.certification.device_id,
      curriculum_id: curriculumId,
      certified_by_user_id: parsed.data.certifiedByUserId,
    },
    ipAddress: getClientIp(req.headers),
  });

  // P10 — admin notification when a practitioner certifies.
  // Mutable category (admins can mute via preferences). Event id
  // keyed on cert row id so re-clicking certify is a no-op.
  void dispatchToAdmins({
    category: "training.certification_completed",
    eventId: `training.certification_completed.${result.certification.id}`,
    title: `Certification completed at ${practice.name}`,
    body: "A practitioner finished training and self-certified.",
    linkPath: `/admin/practices/${practice.id}`,
    metadata: {
      practice_id: practice.id,
      practice_user_id: parsed.data.certifiedByUserId,
      device_id: result.certification.device_id,
      curriculum_id: curriculumId,
    },
  });

  return NextResponse.json({ ok: true, certification: result.certification });
}
