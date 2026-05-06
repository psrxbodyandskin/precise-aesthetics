import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { leadEnricherSchema } from "@/lib/schemas/agents";
import { runLeadEnricher } from "@/lib/agents/lead-enricher";
import { agentRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Manual re-trigger from /admin/inbox/[type]/[id]. Auto-trigger
// lives in the lead/demo/contact creation routes (P9 Phase 9).
// Manual mode bypasses the enriched_at idempotency check so
// admins can force a fresh replay.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  const limit = agentRateLimit(admin.id);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Agent rate limit reached. Try again in a few minutes." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000)).toString(),
        },
      },
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
  const parsed = leadEnricherSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const result = await runLeadEnricher({
    leadType: parsed.data.leadType,
    leadId: parsed.data.leadId,
    triggeredByUserId: admin.id,
    triggerType: "manual",
  });

  if ("status" in result && result.status === "skipped") {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  }

  // Now we know it's an AgentRunResult shape
  const agentResult = result as Awaited<
    ReturnType<typeof runLeadEnricher>
  > & { status: "success" | "failed" };
  return NextResponse.json({
    ok: agentResult.status === "success",
    ...agentResult,
  });
}
