import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { protocolDrafterSchema } from "@/lib/schemas/agents";
import { runProtocolDrafter } from "@/lib/agents/protocol-drafter";

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
  const parsed = protocolDrafterSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const result = await runProtocolDrafter({
    triggeredByUserId: admin.id,
    protocolId: parsed.data.protocolId,
    direction: parsed.data.direction,
    supportingDataSummary: parsed.data.supportingDataSummary ?? null,
  });

  return NextResponse.json({ ok: result.status === "success", ...result });
}
