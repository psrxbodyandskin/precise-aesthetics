import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getAgentRun, runAgent, type AgentType } from "@/lib/agents/base";
import type { AnthropicModel } from "@/lib/anthropic/client";
import { agentRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 90;

// Replay re-runs with the same prompt + user message under a
// new agent_runs row linked via replay_of_id. Cost + latency
// land on the new row; the original is untouched.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id } = await params;

  // P12 — replay also counts toward the 20/admin/hour cap.
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

  const original = await getAgentRun(id);
  if (!original) {
    return NextResponse.json(
      { ok: false, error: "Run not found." },
      { status: 404 },
    );
  }
  if (!original.system_prompt || !original.user_message) {
    return NextResponse.json(
      { ok: false, error: "Original run has no prompt to replay." },
      { status: 400 },
    );
  }

  const result = await runAgent({
    agentType: original.agent_type as AgentType,
    model: original.model as AnthropicModel,
    systemPrompt: original.system_prompt,
    userMessage: original.user_message,
    triggeredByUserId: admin.id,
    triggerType: "manual",
    triggerContext: original.trigger_context as Record<string, unknown> | null,
    replayOfId: id,
  });

  return NextResponse.json({ ok: result.status === "success", ...result });
}
