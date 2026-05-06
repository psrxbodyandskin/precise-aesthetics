import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getDistinctActionVerbs } from "@/lib/admin/audit-log";

export const runtime = "nodejs";

export async function GET() {
  await requireAdmin();
  const verbs = await getDistinctActionVerbs();
  return NextResponse.json({ ok: true, verbs });
}
