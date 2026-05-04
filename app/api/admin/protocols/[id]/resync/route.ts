import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getProtocolById } from "@/lib/admin/protocols";
import { syncProtocolFromSanity } from "@/lib/admin/protocols-sync";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST /api/admin/protocols/[id]/resync
// Force-fetch the document from Sanity and rerun the sync pipeline.
// Useful when a webhook delivery failed silently. Auth: requireAdmin —
// NOT the webhook secret (this is admin-triggered, not Sanity-triggered).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id } = await params;

  const protocolRes = await getProtocolById(id);
  if (protocolRes.error || !protocolRes.data) {
    return NextResponse.json(
      { ok: false, error: "Protocol not found." },
      { status: 404 },
    );
  }

  const result = await syncProtocolFromSanity(protocolRes.data.sanity_id, {
    actorId: admin.id,
  });

  if (result.status === "error") {
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "protocol.resynced",
    targetType: "protocol",
    targetId: id,
    metadata: { action: result.action, reason: result.reason },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({
    ok: true,
    action: result.action,
    reason: result.reason,
  });
}
