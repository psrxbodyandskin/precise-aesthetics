"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CostSummaryRow {
  agent_type: string;
  total_cost_usd: number;
  run_count: number;
}

interface CostByAgentChartProps {
  rows: CostSummaryRow[];
}

const AGENT_LABEL: Record<string, string> = {
  pattern_analyst: "Pattern",
  protocol_drafter: "Protocol",
  practice_health_reviewer: "Health",
  communication_drafter: "Comm",
  query_assistant: "Query",
  lead_enricher: "Enricher",
};

export function CostByAgentChart({ rows }: CostByAgentChartProps) {
  const data = rows.map((r) => ({
    agent: AGENT_LABEL[r.agent_type] ?? r.agent_type,
    cost: Number(r.total_cost_usd),
    runs: Number(r.run_count),
  }));

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 px-6 py-10 text-center">
        <p className="font-body text-caption text-ink-500">
          No cost data in this window.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#E0D8C9" vertical={false} />
          <XAxis
            dataKey="agent"
            stroke="#5A6470"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#5A6470"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
          />
          <Tooltip
            isAnimationActive={false}
            cursor={{ fill: "#F5F0E8" }}
            contentStyle={{
              background: "#FAF7F2",
              border: "1px solid #E0D8C9",
              borderRadius: 4,
              fontSize: 12,
            }}
            formatter={
              ((value: unknown, name: unknown) => {
                if (name === "cost") {
                  return [`$${Number(value as number).toFixed(4)}`, "Cost"];
                }
                return [String(value), String(name ?? "")];
              }) as never
            }
          />
          <Bar dataKey="cost" fill="#0F1419" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
