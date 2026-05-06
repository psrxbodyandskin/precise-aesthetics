import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/server";
import { getAgentRun } from "@/lib/agents/base";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AgentRunResult } from "@/components/admin/ai/AgentRunResult";
import { ReplayButton } from "@/components/admin/ai/ReplayButton";

export const metadata: Metadata = {
  title: "Agent run — Admin",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-bone-200 text-ink-500",
  success: "bg-brand-300/15 text-brand-700",
  failed: "bg-[#FBEAEA] text-[#8A2C2C]",
  cancelled: "bg-bone-200 text-ink-300",
};

const AGENT_LABEL: Record<string, string> = {
  pattern_analyst: "Pattern analyst",
  protocol_drafter: "Protocol drafter",
  practice_health_reviewer: "Practice health reviewer",
  communication_drafter: "Communication drafter",
  query_assistant: "Query assistant",
  lead_enricher: "Lead enricher",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAiRunDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const run = await getAgentRun(id);
  if (!run) notFound();

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "AI" },
          { label: "Runs", href: "/admin/ai/runs" },
          { label: AGENT_LABEL[run.agent_type] ?? run.agent_type },
        ]}
      />

      <header>
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          § {AGENT_LABEL[run.agent_type] ?? run.agent_type}
        </p>
        <h1
          className="mt-3 font-display text-ink-900"
          style={{
            fontSize: "clamp(1.5rem, 1.5vw + 1rem, 2.25rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            fontWeight: 400,
          }}
        >
          Agent run
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 font-body text-[11px] font-medium uppercase ring-1 ring-inset ${STATUS_STYLE[run.status] ?? "bg-bone-200 text-ink-500"} ring-ink-700/15`}
            style={{ letterSpacing: "0.08em" }}
          >
            {run.status}
          </span>
          <span
            className="font-body text-caption text-ink-500"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {new Date(run.created_at).toLocaleString()}
          </span>
          <span className="font-body text-caption text-ink-500">
            {run.trigger_type === "auto" ? "Auto-triggered" : "Manual"}
          </span>
          <span className="font-body text-caption text-ink-500">
            Model: {run.model}
          </span>
          {run.cost_usd !== null && (
            <span
              className="font-body text-caption text-ink-500"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              Cost ${Number(run.cost_usd).toFixed(4)}
            </span>
          )}
          {run.latency_ms !== null && (
            <span
              className="font-body text-caption text-ink-500"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {(run.latency_ms / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        {/* P13 — replay UI hidden for help_assistant rows. Replaying a
            chatbot turn is semantically nonsensical (it would just rerun
            the same one-shot reply, not the conversation). */}
        {run.agent_type !== "help_assistant" && (
          <div className="mt-4">
            <ReplayButton runId={run.id} />
          </div>
        )}
      </header>

      {/* Output (success) or error message (failed) */}
      <section className="mt-10">
        <h2
          className="mb-3 font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          {run.status === "failed" ? "Error" : "Output"}
        </h2>
        {run.status === "failed" ? (
          <div className="rounded-md border border-[#B23B3B]/30 bg-[#FBEAEA]/40 p-5">
            <p className="font-body text-small text-[#8A2C2C]">
              {run.error_message ?? "Unknown error."}
            </p>
          </div>
        ) : run.raw_output ? (
          <AgentRunResult
            output={run.raw_output}
            parsedOutput={run.parsed_output}
            cost={run.cost_usd ? Number(run.cost_usd) : undefined}
            latencyMs={run.latency_ms ?? undefined}
            showToolbar
          />
        ) : (
          <p className="font-body text-caption text-ink-500">
            No output captured.
          </p>
        )}
      </section>

      {/* Input */}
      <section className="mt-10">
        <h2
          className="mb-3 font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          Input
        </h2>
        <details className="rounded-md border border-ink-700/15 bg-bone-50">
          <summary className="cursor-pointer px-4 py-3 font-body text-caption text-ink-700">
            System prompt
          </summary>
          <pre className="overflow-x-auto rounded-b-md bg-bone-100 p-4 font-mono text-caption text-ink-900">
            {run.system_prompt ?? "(none)"}
          </pre>
        </details>
        <details className="mt-3 rounded-md border border-ink-700/15 bg-bone-50" open>
          <summary className="cursor-pointer px-4 py-3 font-body text-caption text-ink-700">
            User message
          </summary>
          <pre className="overflow-x-auto rounded-b-md bg-bone-100 p-4 font-mono text-caption text-ink-900">
            {run.user_message ?? "(none)"}
          </pre>
        </details>
        {run.trigger_context !== null && (
          <details className="mt-3 rounded-md border border-ink-700/15 bg-bone-50">
            <summary className="cursor-pointer px-4 py-3 font-body text-caption text-ink-700">
              Trigger context
            </summary>
            <pre className="overflow-x-auto rounded-b-md bg-bone-100 p-4 font-mono text-caption text-ink-900">
              {JSON.stringify(run.trigger_context, null, 2)}
            </pre>
          </details>
        )}
      </section>

      {/* Replay linkage */}
      {run.replay_of_id && (
        <p className="mt-10 font-body text-caption text-ink-500">
          Replay of{" "}
          <a
            href={`/admin/ai/runs/${run.replay_of_id}`}
            className="text-brand-700 underline-offset-2 hover:underline"
          >
            run {run.replay_of_id.slice(0, 8)}
          </a>
        </p>
      )}
    </div>
  );
}
