import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getProtocolById, setProtocolStatus } from "@/lib/admin/protocols";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST /api/admin/protocols/[id]/archive
// Soft delete. Status='archived' hides from practitioners (RLS) and
// from default admin list views. Versions snapshots stay intact.
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

  const { data, error } = await setProtocolStatus(id, "archived");
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Could not archive." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "protocol.archived",
    targetType: "protocol",
    targetId: id,
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
