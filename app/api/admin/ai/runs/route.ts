import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { listAgentRuns, type AgentType } from "@/lib/agents/base";

export const runtime = "nodejs";

const ALLOWED_AGENT_TYPES: readonly AgentType[] = [
  "pattern_analyst",
  "protocol_drafter",
  "practice_health_reviewer",
  "communication_drafter",
  "query_assistant",
  "lead_enricher",
];

const ALLOWED_STATUSES = ["pending", "success", "failed", "cancelled"] as const;
type AgentStatus = (typeof ALLOWED_STATUSES)[number];

export async function GET(req: NextRequest) {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;

  const agentTypes = sp
    .getAll("agent_type")
    .filter((v): v is AgentType =>
      (ALLOWED_AGENT_TYPES as readonly string[]).includes(v),
    );
  const statuses = sp
    .getAll("status")
    .filter((v): v is AgentStatus =>
      (ALLOWED_STATUSES as readonly string[]).includes(v),
    );
  const triggeredBy = sp.get("triggered_by") ?? undefined;
  const search = sp.get("search") ?? undefined;
  const startDate = sp.get("start_date") ?? undefined;
  const endDate = sp.get("end_date") ?? undefined;
  const page = Number.parseInt(sp.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(sp.get("pageSize") ?? "50", 10);

  const result = await listAgentRuns({
    agentTypes: agentTypes.length > 0 ? agentTypes : undefined,
    statuses: statuses.length > 0 ? statuses : undefined,
    triggeredByUserId: triggeredBy,
    search,
    startDate,
    endDate,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 50,
  });
  return NextResponse.json({ ok: true, ...result });
}
