import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { adverseEventStatusUpdateSchema } from "@/lib/schemas/treatment";
import {
  getAdverseEventById,
  updateAdverseEvent,
} from "@/lib/admin/adverse-events";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";
import { dispatchToPractice } from "@/lib/notifications/dispatch";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const result = await getAdverseEventById(id);
  if (!result) {
    return NextResponse.json(
      { ok: false, error: "Adverse event not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, ...result });
}

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
  const parsed = adverseEventStatusUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const { data, error } = await updateAdverseEvent(
    id,
    {
      status: parsed.data.status,
      adminNotes:
        parsed.data.adminNotes === undefined ? undefined : parsed.data.adminNotes,
    },
    admin.id,
  );
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Could not update." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: parsed.data.status
      ? "adverse_event.status_changed"
      : "adverse_event.notes_updated",
    targetType: "adverse_event",
    targetId: id,
    metadata: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.adminNotes !== undefined
        ? { notes_changed: true }
        : {}),
    },
    ipAddress: getClientIp(req.headers),
  });

  // P10 — notify the reporting practice when status flips.
  // Mandatory category, idempotency keyed on (id, status) so a
  // single status flip dispatches once even if PATCH is retried.
  const adverseRow = data as { practice_id?: string | null; status?: string };
  if (parsed.data.status && adverseRow.practice_id) {
    const newStatus = parsed.data.status;
    void dispatchToPractice(adverseRow.practice_id, {
      category: "adverse_event.status_updated",
      eventId: `adverse_event.status_updated.${id}.${newStatus}`,
      title: `Adverse event marked ${newStatus.replace("_", " ")}`,
      body:
        newStatus === "addressed"
          ? "Clinical staff finished reviewing your report."
          : `Status moved to ${newStatus}.`,
      linkPath: `/portal/treatments`,
      metadata: {
        adverse_event_id: id,
        new_status: newStatus,
      },
    });
  }

  return NextResponse.json({ ok: true, adverse: data });
}
