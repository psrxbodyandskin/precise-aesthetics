import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { recertFlagSchema } from "@/lib/schemas/training";
import { setRecertFlag } from "@/lib/admin/training";
import { logAudit } from "@/lib/admin/audit";
import {
  TRAINING_AUDIT_VERBS,
  TRAINING_AUDIT_TARGET_TYPES,
} from "@/lib/schemas/training";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// PATCH /api/admin/practices/[id]/certifications/[deviceId]/recert
//
// Flips the recert_required flag on the practice's certification
// for this device. P9 ships flag-only — no automated triggers,
// no revocation. Banner surfaces in /portal/training; admin closes
// the loop later via certification.recert_resolved when the practice
// re-completes the curriculum.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; deviceId: string }> },
) {
  const admin = await requireAdmin();
  const { id: practiceId, deviceId } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = recertFlagSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const result = await setRecertFlag({
    practiceId,
    deviceId,
    recertRequired: parsed.data.recertRequired,
    recertReason: parsed.data.recertReason || null,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not update recert flag." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: parsed.data.recertRequired
      ? TRAINING_AUDIT_VERBS.certificationRecertRequired
      : TRAINING_AUDIT_VERBS.certificationRecertResolved,
    targetType: TRAINING_AUDIT_TARGET_TYPES.certification,
    targetId: practiceId,
    metadata: {
      device_id: deviceId,
      recert_required: parsed.data.recertRequired,
      reason: parsed.data.recertReason || null,
    },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
