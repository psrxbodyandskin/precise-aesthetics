import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/server";
import { listAgentRuns, type AgentType } from "@/lib/agents/base";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { RunsTable } from "@/components/admin/ai/RunsTable";
import { RunsFilterBar } from "@/components/admin/ai/RunsFilterBar";

export const metadata: Metadata = {
  title: "Agent runs — Admin",
  robots: { index: false, follow: false },
};

const ALLOWED_AGENT_TYPES: readonly AgentType[] = [
  "pattern_analyst",
  "protocol_drafter",
  "practice_health_reviewer",
  "communication_drafter",
  "query_assistant",
  "lead_enricher",
  "help_assistant",
];

// P13 — agent types shown by default. Help chatbot conversations are
// noisy and instructional; operator opts in via ?show_help=1.
const DEFAULT_VISIBLE_AGENT_TYPES: readonly AgentType[] = [
  "pattern_analyst",
  "protocol_drafter",
  "practice_health_reviewer",
  "communication_drafter",
  "query_assistant",
  "lead_enricher",
];

const ALLOWED_STATUSES = ["pending", "success", "failed", "cancelled"] as const;
type AgentStatus = (typeof ALLOWED_STATUSES)[number];

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminAiRunsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const sp = await searchParams;
  const rawAgents = Array.isArray(sp.agent_type)
    ? sp.agent_type
    : sp.agent_type
      ? [sp.agent_type]
      : [];
  const rawStatuses = Array.isArray(sp.status)
    ? sp.status
    : sp.status
      ? [sp.status]
      : [];
  const agentTypes = rawAgents.filter((v): v is AgentType =>
    (ALLOWED_AGENT_TYPES as readonly string[]).includes(v),
  );
  const statuses = rawStatuses.filter((v): v is AgentStatus =>
    (ALLOWED_STATUSES as readonly string[]).includes(v),
  );

  const showHelp = sp.show_help === "1";

  // If no explicit agent_type filter and show_help is off, default to
  // hiding help_assistant by passing the visible set. If show_help is
  // on, pass nothing (show everything).
  const effectiveAgentTypes =
    agentTypes.length > 0
      ? agentTypes
      : showHelp
        ? undefined
        : DEFAULT_VISIBLE_AGENT_TYPES;

  const result = await listAgentRuns({
    agentTypes: effectiveAgentTypes ? [...effectiveAgentTypes] : undefined,
    statuses: statuses.length > 0 ? statuses : undefined,
    pageSize: 100,
  });

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb items={[{ label: "AI" }, { label: "Runs" }]} />
      <AdminPageHeader
        eyebrow="AI · Run history"
        title="Agent runs."
        lead="Every AI agent execution is logged here — input, output, tokens, cost, latency."
      />

      <div className="mt-10">
        <RunsFilterBar />
      </div>

      <div className="mt-6">
        <RunsTable items={result.items} />
      </div>
    </div>
  );
}
