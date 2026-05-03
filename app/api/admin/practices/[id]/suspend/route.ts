import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { setPracticeStatus } from "@/lib/admin/practices";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST /api/admin/practices/[id]/suspend
//
// Per ambiguity E: status change + audit only. No email to practice
// (P10 owns all practice-facing communication).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id } = await params;

  const { data, error } = await setPracticeStatus(id, "suspended", admin.id);
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: "Could not suspend practice." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "practice.suspended",
    targetType: "practice",
    targetId: id,
    metadata: {},
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true, practice: data });
}
