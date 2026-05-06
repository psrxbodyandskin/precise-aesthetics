import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { streamAuditLogCsv, CSV_EXPORT_HARD_CAP } from "@/lib/admin/audit-log";
import { auditLogExportFiltersSchema } from "@/lib/schemas/audit-log";

export const runtime = "nodejs";

// P14 — CSV export of filtered audit log.
// Hard-capped at 10k rows. If the filter set yields more, returns a
// 413 with a clear error pointing the operator at tighter filters or
// Supabase SQL editor for compliance dumps.

export async function GET(req: NextRequest) {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;

  const parsed = auditLogExportFiltersSchema.safeParse({
    q: sp.get("q") ?? undefined,
    actor_id: sp.get("actor_id") ?? undefined,
    actor_role: sp.get("actor_role") ?? undefined,
    action: sp.get("action") ?? undefined,
    target_type: sp.get("target_type") ?? undefined,
    target_id: sp.get("target_id") ?? undefined,
    practice_id: sp.get("practice_id") ?? undefined,
    date_from: sp.get("date_from") ?? undefined,
    date_to: sp.get("date_to") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid filters" },
      { status: 400 },
    );
  }

  const result = await streamAuditLogCsv(parsed.data);
  if (result.tooLarge) {
    return NextResponse.json(
      {
        ok: false,
        error: `Filter set yields ${result.total.toLocaleString()} rows, exceeds ${CSV_EXPORT_HARD_CAP.toLocaleString()} export cap. Tighten filters (date range / action verb / target type) and try again. For full dumps, use Supabase SQL editor with admin oversight.`,
        total: result.total,
        cap: CSV_EXPORT_HARD_CAP,
      },
      { status: 413 },
    );
  }

  // ISO date in filename for sortability
  const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(result.csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
