import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/admin/ai/cost-summary?range=30d
//
// Drives /admin/ai/cost dashboard. Calls agent_cost_summary RPC
// (admin-gated SECURITY DEFINER) for the requested window.
const VALID_RANGES = ["7d", "30d", "90d", "12m", "all"] as const;
type Range = (typeof VALID_RANGES)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

function rangeToWindow(range: Range): { start: string; end: string } {
  const end = new Date();
  let start: Date;
  switch (range) {
    case "7d":
      start = new Date(end.getTime() - 7 * DAY_MS);
      break;
    case "30d":
      start = new Date(end.getTime() - 30 * DAY_MS);
      break;
    case "90d":
      start = new Date(end.getTime() - 90 * DAY_MS);
      break;
    case "12m":
      start = new Date(end.getTime() - 365 * DAY_MS);
      break;
    case "all":
    default:
      start = new Date("2000-01-01T00:00:00Z");
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function GET(req: NextRequest) {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const rawRange = sp.get("range") ?? "30d";
  const range: Range = (VALID_RANGES as readonly string[]).includes(rawRange)
    ? (rawRange as Range)
    : "30d";

  const { start, end } = rangeToWindow(range);

  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("agent_cost_summary", {
    range_start: start,
    range_end: end,
  });
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, range, start, end, summary: data ?? [] });
}
