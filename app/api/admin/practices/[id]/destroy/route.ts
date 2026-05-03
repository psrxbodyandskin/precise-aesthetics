import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { deletePracticeHard, getPracticeById } from "@/lib/admin/practices";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// DELETE /api/admin/practices/[id]/destroy
//
// Hard delete: removes the practices row (cascade kills practice_users,
// practice_devices, practice_authorized_users) and the linked auth user.
// Distinct from the soft-delete DELETE on /api/admin/practices/[id]
// (which sets status to 'archived' and keeps the row for compliance).
//
// Use this for half-provisioned records and test accounts. Audit log
// entries persist with the orphaned target_id — that's intentional;
// the compliance trail must outlive the record.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id } = await params;

  // Snapshot a few details for the audit log before the row goes.
  const { data: practice } = await getPracticeById(id);
  const snapshot = practice
    ? {
        name: practice.name,
        primary_email: practice.primary_email,
        status: practice.status,
      }
    : null;

  const result = await deletePracticeHard(id);
  if (result.status !== "ok") {
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "practice.deleted",
    targetType: "practice",
    targetId: id,
    metadata: snapshot ?? {},
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
