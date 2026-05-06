import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getAgentRun } from "@/lib/agents/base";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const run = await getAgentRun(id);
  if (!run) {
    return NextResponse.json(
      { ok: false, error: "Run not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, run });
}
