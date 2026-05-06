import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getClientIp } from "@/lib/rate-limit";
import { removeEnvVar } from "@/lib/admin/stack";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ varId: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin();
  const { varId } = await params;
  const result = await removeEnvVar(varId, {
    actorId: admin.id,
    ipAddress: getClientIp(req.headers),
  });
  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
