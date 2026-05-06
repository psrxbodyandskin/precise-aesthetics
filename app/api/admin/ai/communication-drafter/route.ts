import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { communicationDrafterSchema } from "@/lib/schemas/agents";
import { runCommunicationDrafter } from "@/lib/agents/communication-drafter";
import { agentRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const parsed = communicationDrafterSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const result = await runCommunicationDrafter({
    triggeredByUserId: admin.id,
    recipientContext: parsed.data.recipientContext,
    purpose: parsed.data.purpose,
    additionalNotes: parsed.data.additionalNotes ?? null,
  });

  return NextResponse.json({ ok: result.status === "success", ...result });
}
