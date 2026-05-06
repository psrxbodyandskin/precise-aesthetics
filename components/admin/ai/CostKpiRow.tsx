interface CostSummaryRow {
  agent_type: string;
  run_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
}

interface CostKpiRowProps {
  rows: CostSummaryRow[];
  rangeLabel: string;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function CostKpiRow({ rows, rangeLabel }: CostKpiRowProps) {
  const totalCost = rows.reduce((s, r) => s + Number(r.total_cost_usd), 0);
  const totalRuns = rows.reduce((s, r) => s + Number(r.run_count), 0);
  const totalTokens = rows.reduce(
    (s, r) =>
      s + Number(r.total_input_tokens) + Number(r.total_output_tokens),
    0,
  );
  const avgCost = totalRuns > 0 ? totalCost / totalRuns : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi label={`Total cost · ${rangeLabel}`} value={`$${totalCost.toFixed(4)}`} />
      <Kpi label="Total runs" value={String(totalRuns)} />
      <Kpi label="Total tokens" value={totalTokens.toLocaleString()} />
      <Kpi label="Avg cost / run" value={`$${avgCost.toFixed(4)}`} />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
      <p
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {label}
      </p>
      <p
        className="mt-2 font-display text-2xl text-ink-900"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </p>
    </div>
  );
}
