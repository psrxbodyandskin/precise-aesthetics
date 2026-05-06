import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import {
  listAuditLogEntries,
} from "@/lib/admin/audit-log";
import { auditLogFiltersSchema } from "@/lib/schemas/audit-log";

export const runtime = "nodejs";

// P14 — list audit log entries with filters + pagination.
// Read-only. Filters serialized via URL query params; same shape used
// across the page's URL state and the API.

export async function GET(req: NextRequest) {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;

  const parsed = auditLogFiltersSchema.safeParse({
    q: sp.get("q") ?? undefined,
    actor_id: sp.get("actor_id") ?? undefined,
    actor_role: sp.get("actor_role") ?? undefined,
    action: sp.get("action") ?? undefined,
    target_type: sp.get("target_type") ?? undefined,
    target_id: sp.get("target_id") ?? undefined,
    practice_id: sp.get("practice_id") ?? undefined,
    date_from: sp.get("date_from") ?? undefined,
    date_to: sp.get("date_to") ?? undefined,
    page: sp.get("page") ?? undefined,
    page_size: sp.get("page_size") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid filters" },
      { status: 400 },
    );
  }

  const result = await listAuditLogEntries(parsed.data);
  return NextResponse.json({
    ok: true,
    entries: result.entries,
    total: result.total,
    page: parsed.data.page ?? 1,
    pageSize: parsed.data.page_size ?? 50,
  });
}
