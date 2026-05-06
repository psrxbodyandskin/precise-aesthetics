import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { practiceHealthSchema } from "@/lib/schemas/agents";
import { runPracticeHealthReviewer } from "@/lib/agents/practice-health-reviewer";

export const runtime = "nodejs";
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
  const parsed = practiceHealthSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const result = await runPracticeHealthReviewer({
    triggeredByUserId: admin.id,
    timeRangeDays: parsed.data.timeRangeDays,
  });

  return NextResponse.json({ ok: result.status === "success", ...result });
}
