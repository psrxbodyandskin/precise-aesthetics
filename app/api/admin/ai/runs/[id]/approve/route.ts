import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { approveAgentRun, getAgentRun } from "@/lib/agents/base";
import { approveAgentRunSchema } from "@/lib/schemas/agents";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST /api/admin/ai/runs/[id]/approve
//
// Records text-only approval + applied_action. P11 doesn't
// auto-mutate Sanity or auto-send email — Roni applies the
// agent's output externally and then writes a one-line record
// of what she did for the audit trail.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = approveAgentRunSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const original = await getAgentRun(id);
  if (!original) {
    return NextResponse.json(
      { ok: false, error: "Run not found." },
      { status: 404 },
    );
  }

  const result = await approveAgentRun({
    runId: id,
    approverUserId: admin.id,
    appliedAction: parsed.data.appliedAction ?? null,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not approve." },
      { status: 500 },
    );
  }

  // Audit log per Q10. Two verbs: approved is always written;
  // applied is only written when an applied_action was provided.
  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "agent_run.approved",
    targetType: "agent_run",
    targetId: id,
    metadata: { agent_type: original.agent_type },
    ipAddress: getClientIp(req.headers),
  });
  if (parsed.data.appliedAction) {
    await logAudit({
      actorId: admin.id,
      actorRole: "admin",
      action: "agent_run.applied",
      targetType: "agent_run",
      targetId: id,
      metadata: {
        agent_type: original.agent_type,
        applied_action: parsed.data.appliedAction,
      },
      ipAddress: getClientIp(req.headers),
    });
  }

  return NextResponse.json({ ok: true });
}
