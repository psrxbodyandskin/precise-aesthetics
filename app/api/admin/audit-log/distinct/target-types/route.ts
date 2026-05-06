import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getDistinctTargetTypes } from "@/lib/admin/audit-log";

export const runtime = "nodejs";

export async function GET() {
  await requireAdmin();
  const types = await getDistinctTargetTypes();
  return NextResponse.json({ ok: true, types });
}
