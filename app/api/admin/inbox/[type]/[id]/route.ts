import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { inboxItemUpdateSchema } from "@/lib/schemas/inbox";
import {
  auditTargetTypeFor,
  getAuditTrailFor,
  getContactMessageById,
  getDemoRequestById,
  getLeadById,
  isInboxItemType,
  type InboxItemType,
  updateInboxItemNotes,
  updateInboxItemStatus,
} from "@/lib/admin/inbox";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

async function fetchByType(type: InboxItemType, id: string) {
  switch (type) {
    case "lead":
      return getLeadById(id);
    case "demo":
      return getDemoRequestById(id);
    case "contact":
      return getContactMessageById(id);
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  await requireAdmin();
  const { type: rawType, id } = await params;

  if (!isInboxItemType(rawType)) {
    return NextResponse.json(
      { ok: false, error: "Unknown inbox item type." },
      { status: 400 },
    );
  }

  const item = await fetchByType(rawType, id);
  if (!item) {
    return NextResponse.json(
      { ok: false, error: "Inbox item not found." },
      { status: 404 },
    );
  }

  const audit = await getAuditTrailFor(rawType, id);

  return NextResponse.json({ ok: true, type: rawType, item, audit });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const admin = await requireAdmin();
  const { type: rawType, id } = await params;

  if (!isInboxItemType(rawType)) {
    return NextResponse.json(
      { ok: false, error: "Unknown inbox item type." },
      { status: 400 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = inboxItemUpdateSchema.safeParse(json);
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
  const { status, adminNotes } = parsed.data;

  const targetType = auditTargetTypeFor(rawType);
  const ipAddress = getClientIp(req.headers);

  if (status !== undefined) {
    const result = await updateInboxItemStatus({
      type: rawType,
      id,
      newStatus: status,
      actorId: admin.id,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error ?? "Could not update status." },
        { status: result.error === "Not found" ? 404 : 500 },
      );
    }
    if (result.previousStatus !== status) {
      await logAudit({
        actorId: admin.id,
        actorRole: "admin",
        action: `${targetType}.status_changed`,
        targetType,
        targetId: id,
        metadata: {
          from: result.previousStatus,
          to: status,
        },
        ipAddress,
      });
    }
  }

  if (adminNotes !== undefined) {
    const trimmed = adminNotes;
    const result = await updateInboxItemNotes({
      type: rawType,
      id,
      notes: trimmed,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error ?? "Could not update notes." },
        { status: 500 },
      );
    }
    await logAudit({
      actorId: admin.id,
      actorRole: "admin",
      action: `${targetType}.notes_updated`,
      targetType,
      targetId: id,
      metadata: { notes_changed: true },
      ipAddress,
    });
  }

  const item = await fetchByType(rawType, id);
  return NextResponse.json({ ok: true, type: rawType, item });
}
