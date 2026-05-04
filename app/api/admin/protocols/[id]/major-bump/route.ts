import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { protocolMajorBumpSchema } from "@/lib/schemas/protocol";
import { getProtocolById, setPendingMajorBump } from "@/lib/admin/protocols";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// PATCH /api/admin/protocols/[id]/major-bump
// Toggle the pending_major_bump flag. The next webhook publish reads
// + clears the flag, bumping the version major instead of minor.
// Detail view shows a banner while the flag is active so the admin
// knows the next publish will be a major bump.
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

  const parsed = protocolMajorBumpSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const protocolRes = await getProtocolById(id);
  if (protocolRes.error || !protocolRes.data) {
    return NextResponse.json(
      { ok: false, error: "Protocol not found." },
      { status: 404 },
    );
  }

  const { data, error } = await setPendingMajorBump(
    id,
    parsed.data.pendingMajorBump,
  );
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Could not update flag." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: parsed.data.pendingMajorBump
      ? "protocol.major_bump_armed"
      : "protocol.major_bump_disarmed",
    targetType: "protocol",
    targetId: id,
    metadata: { current_version: data.current_version },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({
    ok: true,
    pendingMajorBump: data.pending_major_bump,
  });
}
