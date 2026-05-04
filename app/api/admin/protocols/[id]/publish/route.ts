import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getProtocolById, setProtocolStatus } from "@/lib/admin/protocols";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST /api/admin/protocols/[id]/publish
// Force the Supabase status to 'published'. Note: the typical publish
// path is "publish in Sanity Studio → webhook fires → status syncs."
// This endpoint exists for cases where the Sanity status is already
// published but the Supabase mirror got out of sync (e.g., webhook
// missed). It does NOT trigger a new version snapshot — that only
// happens via the webhook sync. Use force-resync for that.
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

  const { data, error } = await setProtocolStatus(id, "published");
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Could not publish." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "protocol.published_admin",
    targetType: "protocol",
    targetId: id,
    metadata: { source: "admin_force" },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
