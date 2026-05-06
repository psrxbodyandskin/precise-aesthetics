import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/server";
import { getServiceClient } from "@/lib/supabase/server";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { CostKpiRow } from "@/components/admin/ai/CostKpiRow";
import { CostByAgentChart } from "@/components/admin/ai/CostByAgentChart";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AI cost — Admin",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

const VALID_RANGES = ["7d", "30d", "90d", "12m", "all"] as const;
type Range = (typeof VALID_RANGES)[number];

const RANGE_LABEL: Record<Range, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
  all: "All time",
};

const AGENT_LABEL: Record<string, string> = {
  pattern_analyst: "Pattern analyst",
  protocol_drafter: "Protocol drafter",
  practice_health_reviewer: "Practice health reviewer",
  communication_drafter: "Communication drafter",
  query_assistant: "Query assistant",
  lead_enricher: "Lead enricher",
};

const DAY_MS = 24 * 60 * 60 * 1000;

function rangeToWindow(range: Range): { start: string; end: string } {
  const end = new Date();
  let start: Date;
  switch (range) {
    case "7d":
      start = new Date(end.getTime() - 7 * DAY_MS);
      break;
    case "30d":
      start = new Date(end.getTime() - 30 * DAY_MS);
      break;
    case "90d":
      start = new Date(end.getTime() - 90 * DAY_MS);
      break;
    case "12m":
      start = new Date(end.getTime() - 365 * DAY_MS);
      break;
    case "all":
    default:
      start = new Date("2000-01-01T00:00:00Z");
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

interface CostSummaryRow {
  agent_type: string;
  run_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminAiCostPage({ searchParams }: PageProps) {
  await requireAdmin();

  const sp = await searchParams;
  const rawRange = typeof sp.range === "string" ? sp.range : "30d";
  const range: Range = (VALID_RANGES as readonly string[]).includes(rawRange)
    ? (rawRange as Range)
    : "30d";

  const { start, end } = rangeToWindow(range);

  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("agent_cost_summary", {
    range_start: start,
    range_end: end,
  });

  const rows: CostSummaryRow[] = error
    ? []
    : ((data ?? []) as unknown as CostSummaryRow[]);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb items={[{ label: "AI" }, { label: "Cost" }]} />
      <AdminPageHeader
        eyebrow="AI · Cost"
        title="Agent spend."
        lead="Anthropic API spend by agent. Failed runs aren't billed and are excluded."
      />

      {/* Range filter */}
      <div className="mt-10 flex flex-wrap items-center gap-2">
        <span
          className="font-body text-caption text-ink-500"
          style={{ letterSpacing: "0.04em" }}
        >
          Range:
        </span>
        {VALID_RANGES.map((r) => (
          <a
            key={r}
            href={r === "30d" ? "/admin/ai/cost" : `/admin/ai/cost?range=${r}`}
            className={cn(
              "inline-flex h-8 items-center rounded-sm border px-2.5 font-body text-caption font-medium transition-colors duration-[150ms]",
              range === r
                ? "border-midnight-800 bg-midnight-800 text-cream-50"
                : "border-ink-100 bg-bone-100 text-ink-700 hover:border-ink-700/35",
            )}
          >
            {RANGE_LABEL[r]}
          </a>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-[#B23B3B]/30 bg-[#FBEAEA]/40 p-5">
          <p className="font-body text-small text-[#8A2C2C]">
            Failed to load cost summary: {error.message}
          </p>
        </div>
      )}

      {/* KPI row */}
      <div className="mt-8">
        <CostKpiRow rows={rows} rangeLabel={RANGE_LABEL[range]} />
      </div>

      {/* Chart */}
      <section className="mt-10">
        <h2
          className="mb-3 font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          Cost by agent
        </h2>
        <CostByAgentChart rows={rows} />
      </section>

      {/* Per-agent breakdown table */}
      <section className="mt-10">
        <h2
          className="mb-3 font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          Breakdown
        </h2>
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 px-6 py-10 text-center">
            <p className="font-body text-caption text-ink-500">
              No agent runs in this window.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-ink-700/15 bg-bone-50">
            <table className="w-full font-body text-small">
              <thead>
                <tr className="border-b border-ink-700/10">
                  <th
                    className="px-4 py-3 text-left text-overline font-medium uppercase text-ink-500"
                    style={EYEBROW_TRACKING}
                  >
                    Agent
                  </th>
                  <th
                    className="px-4 py-3 text-right text-overline font-medium uppercase text-ink-500"
                    style={EYEBROW_TRACKING}
                  >
                    Runs
                  </th>
                  <th
                    className="px-4 py-3 text-right text-overline font-medium uppercase text-ink-500"
                    style={EYEBROW_TRACKING}
                  >
                    Input tokens
                  </th>
                  <th
                    className="px-4 py-3 text-right text-overline font-medium uppercase text-ink-500"
                    style={EYEBROW_TRACKING}
                  >
                    Output tokens
                  </th>
                  <th
                    className="px-4 py-3 text-right text-overline font-medium uppercase text-ink-500"
                    style={EYEBROW_TRACKING}
                  >
                    Cost
                  </th>
                  <th
                    className="px-4 py-3 text-right text-overline font-medium uppercase text-ink-500"
                    style={EYEBROW_TRACKING}
                  >
                    Avg / run
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const cost = Number(r.total_cost_usd);
                  const runs = Number(r.run_count);
                  const avg = runs > 0 ? cost / runs : 0;
                  return (
                    <tr
                      key={r.agent_type}
                      className="border-b border-ink-700/5 last:border-0"
                    >
                      <td className="px-4 py-3 text-ink-900">
                        {AGENT_LABEL[r.agent_type] ?? r.agent_type}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-ink-700"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {runs}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-ink-700"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {Number(r.total_input_tokens).toLocaleString()}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-ink-700"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {Number(r.total_output_tokens).toLocaleString()}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-ink-900"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        ${cost.toFixed(4)}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-ink-500"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        ${avg.toFixed(4)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-8 font-body text-caption text-ink-500">
        Window: {new Date(start).toLocaleDateString()} —{" "}
        {new Date(end).toLocaleDateString()}. Failed runs excluded (Anthropic
        only bills successful completions).
      </p>
    </div>
  );
}
