import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import {
  deleteProtocolHard,
  getProtocolById,
} from "@/lib/admin/protocols";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// DELETE /api/admin/protocols/[id]/destroy
//
// Hard delete: drops the protocols row and cascades into
// protocol_devices + protocol_versions. Distinct from POST /archive
// (status='archived', preserves all rows). Use this for test
// cleanup and for deletes initiated outside Sanity Studio.
//
// Per P4 spec: only allowed if no treatment_logs reference any of
// this protocol's versions. The countTreatmentLogReferences guard
// returns 409 with code:"has_references" when the table exists in
// P6+ and rows match. Right now treatment_logs doesn't exist; the
// guard cleanly returns zero and delete proceeds.
//
// Sanity-side: this endpoint does NOT delete the Sanity document.
// If you also want the Sanity content gone, delete it in Studio
// AFTER calling this endpoint (otherwise the next webhook delivery
// will reinstate the Supabase row). Common cleanup flow:
//   1. Delete in Sanity Studio (webhook archives the Supabase row)
//   2. Then call this endpoint to drop the archived row entirely
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id } = await params;

  // Snapshot identity for the audit log before the row goes.
  const { data: snapshot } = await getProtocolById(id);
  const audit = snapshot
    ? {
        title: snapshot.title,
        slug: snapshot.slug,
        status: snapshot.status,
        sanity_id: snapshot.sanity_id,
        current_version: snapshot.current_version,
      }
    : null;

  const result = await deleteProtocolHard(id);
  if (result.status !== "ok") {
    const status = result.code === "has_references" ? 409 : 500;
    return NextResponse.json(
      { ok: false, error: result.message, code: result.code },
      { status },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "protocol.deleted",
    targetType: "protocol",
    targetId: id,
    metadata: audit ?? {},
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
