import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { practiceUpdateSchema } from "@/lib/schemas/practice";
import {
  getPracticeById,
  listPracticeDevicesForPractice,
  listPracticeUsersForPractice,
  listAuditLogForPractice,
  setPracticeStatus,
  updatePractice,
} from "@/lib/admin/practices";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// ----------------------------------------------------------------
// GET /api/admin/practices/[id] — full detail (practice + devices + users + audit)
// ----------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const [practiceRes, devicesRes, usersRes, auditRes] = await Promise.all([
    getPracticeById(id),
    listPracticeDevicesForPractice(id),
    listPracticeUsersForPractice(id),
    listAuditLogForPractice(id),
  ]);

  if (practiceRes.error || !practiceRes.data) {
    return NextResponse.json(
      { ok: false, error: "Practice not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    practice: practiceRes.data,
    devices: devicesRes.data ?? [],
    users: usersRes.data ?? [],
    auditLog: auditRes.data ?? [],
  });
}

// ----------------------------------------------------------------
// PATCH /api/admin/practices/[id] — partial update (Identity / Address /
// Internal notes modals on the detail page)
// ----------------------------------------------------------------
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

  const parsed = practiceUpdateSchema.safeParse(json);
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

  const { data, error } = await updatePractice(id, parsed.data);
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: "Could not update practice." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "practice.updated",
    targetType: "practice",
    targetId: id,
    metadata: { fields: Object.keys(parsed.data) },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true, practice: data });
}

// ----------------------------------------------------------------
// DELETE /api/admin/practices/[id] — archive (soft delete)
// ----------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id } = await params;

  const { data, error } = await setPracticeStatus(id, "archived", admin.id);
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: "Could not archive practice." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "practice.archived",
    targetType: "practice",
    targetId: id,
    metadata: {},
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true, practice: data });
}
