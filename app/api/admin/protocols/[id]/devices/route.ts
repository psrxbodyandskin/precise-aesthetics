import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { protocolDeviceTagsSchema } from "@/lib/schemas/protocol";
import {
  getProtocolById,
  replaceProtocolDevices,
} from "@/lib/admin/protocols";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// PATCH /api/admin/protocols/[id]/devices
// Replace the device-tag set for a protocol. Empty set is allowed
// (admin may save zero devices on a draft); the detail-view UI surfaces
// a warning that practitioners can't see protocols with no devices.
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

  const parsed = protocolDeviceTagsSchema.safeParse(json);
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

  const protocolRes = await getProtocolById(id);
  if (protocolRes.error || !protocolRes.data) {
    return NextResponse.json(
      { ok: false, error: "Protocol not found." },
      { status: 404 },
    );
  }

  const result = await replaceProtocolDevices(id, parsed.data.deviceIds);
  if (result.status !== "ok") {
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "protocol.devices_updated",
    targetType: "protocol",
    targetId: id,
    metadata: { count: result.count },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true, count: result.count });
}
