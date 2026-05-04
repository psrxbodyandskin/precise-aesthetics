import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getProtocolById, setProtocolStatus } from "@/lib/admin/protocols";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST /api/admin/protocols/[id]/unpublish
// Sets the protocol back to 'draft' on the Supabase mirror. RLS hides
// drafts from practitioners. Existing protocol_versions snapshots stay
// intact — treatment logs that reference them keep working.
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

  const { data, error } = await setProtocolStatus(id, "draft");
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Could not unpublish." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "protocol.unpublished",
    targetType: "protocol",
    targetId: id,
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
