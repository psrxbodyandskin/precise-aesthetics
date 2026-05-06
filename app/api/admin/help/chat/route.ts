import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/server";
import { runHelpAssistant } from "@/lib/agents/help-assistant";
import { helpChatRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
// Haiku replies are fast (typically <5s) but allow headroom.
export const maxDuration = 30;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  // P13 — dedicated 30/admin/hour bucket for the chatbot
  const limit = helpChatRateLimit(admin.id);
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Help chatbot rate limit reached. Try again in a few minutes.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(
            1,
            Math.ceil((limit.resetAt - Date.now()) / 1000),
          ).toString(),
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

  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid messages" },
      { status: 400 },
    );
  }

  // Last message must be the user's question
  const last = parsed.data.messages[parsed.data.messages.length - 1];
  if (!last || last.role !== "user") {
    return NextResponse.json(
      { ok: false, error: "Last message must be from the user" },
      { status: 400 },
    );
  }

  const result = await runHelpAssistant({
    triggeredByUserId: admin.id,
    messages: parsed.data.messages,
  });

  return NextResponse.json({
    ok: result.status === "success",
    answer: result.output ?? null,
    cost: result.cost,
    runId: result.runId,
    error: result.error,
  });
}
