import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { queryAssistantSchema } from "@/lib/schemas/agents";
import { runQueryAssistant } from "@/lib/agents/query-assistant";
import { agentRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
// Three Anthropic passes plus SQL execution — give it headroom.
export const maxDuration = 90;

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
  const parsed = queryAssistantSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const result = await runQueryAssistant({
    triggeredByUserId: admin.id,
    question: parsed.data.question,
  });

  return NextResponse.json({ ok: result.status === "success", ...result });
}
