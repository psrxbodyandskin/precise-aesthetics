import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import {
  getProtocolById,
  getProtocolSanityContent,
  listAuditLogForProtocol,
  listProtocolDevices,
  listProtocolVersions,
} from "@/lib/admin/protocols";

export const runtime = "nodejs";

// GET /api/admin/protocols/[id] — full detail (Sanity content + Supabase metadata + history)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const protocolRes = await getProtocolById(id);
  if (protocolRes.error || !protocolRes.data) {
    return NextResponse.json(
      { ok: false, error: "Protocol not found." },
      { status: 404 },
    );
  }
  const protocol = protocolRes.data;

  const [devicesRes, versionsRes, auditRes, sanityDoc] = await Promise.all([
    listProtocolDevices(id),
    listProtocolVersions(id),
    listAuditLogForProtocol(id),
    getProtocolSanityContent(protocol.sanity_id),
  ]);

  return NextResponse.json({
    ok: true,
    protocol,
    devices: devicesRes.data ?? [],
    versions: versionsRes.data ?? [],
    auditLog: auditRes.data ?? [],
    sanityDoc: sanityDoc ?? null,
  });
}
