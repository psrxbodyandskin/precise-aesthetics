import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { patternAnalystSchema } from "@/lib/schemas/agents";
import { runPatternAnalyst } from "@/lib/agents/pattern-analyst";

export const runtime = "nodejs";
// Anthropic calls can take 30s+; default 10s timeout would kill them.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = patternAnalystSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const result = await runPatternAnalyst({
    triggeredByUserId: admin.id,
    timeRangeStart: parsed.data.timeRangeStart,
    timeRangeEnd: parsed.data.timeRangeEnd,
    filterByProtocol: parsed.data.filterByProtocol ?? null,
    filterByFitzpatrick: parsed.data.filterByFitzpatrick ?? null,
    focusOnAdverseEvents: parsed.data.focusOnAdverseEvents,
  });

  return NextResponse.json({ ok: result.status === "success", ...result });
}
