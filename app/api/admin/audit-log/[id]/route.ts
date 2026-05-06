import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getAuditLogEntryById } from "@/lib/admin/audit-log";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  await requireAdmin();
  const { id } = await params;

  const entry = await getAuditLogEntryById(id);
  if (!entry) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, entry });
}
