"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { IndicationSlice } from "@/lib/admin/dashboard";

interface IndicationDistributionChartProps {
  slices: IndicationSlice[];
}

// Brand-spectrum donut palette — keeps the chart in the same color
// register as the rest of the editorial system. "Other" gets ink-300.
const PALETTE = [
  "#3F5A82", // brand-700
  "#A8C8E8", // brand-300
  "#8FA8D2",
  "#C9B68F",
  "#5A6470",
  "#1F2F4F",
  "#E0D8C9",
  "#7B8AA3",
];
const OTHER_COLOR = "#94A3B8";

export function IndicationDistributionChart({
  slices,
}: IndicationDistributionChartProps) {
  const total = slices.reduce((acc, s) => acc + s.n, 0);

  return (
    <div className="grid h-[280px] grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="n"
            nameKey="indication"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={1}
            stroke="#FAF7F2"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {slices.map((s, i) => (
              <Cell
                key={s.indication}
                fill={s.indication === "Other" ? OTHER_COLOR : PALETTE[i % PALETTE.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#FAF7F2",
              border: "1px solid #E0D8C9",
              borderRadius: "4px",
              fontFamily: "var(--font-body), Inter, sans-serif",
              fontSize: 12,
            }}
            formatter={((value: unknown, _name: unknown, item: unknown) => {
              const v = typeof value === "number" ? value : Number(value ?? 0);
              const pct = total > 0 ? Math.round((v / total) * 100) : 0;
              const indication =
                (item as { payload?: { indication?: string } })?.payload
                  ?.indication ?? "";
              return [`${v} (${pct}%)`, indication];
            }) as never}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend — sober list to the right */}
      <ul className="self-center space-y-2 overflow-y-auto md:max-h-[220px]">
        {slices.map((s, i) => {
          const pct = total > 0 ? Math.round((s.n / total) * 100) : 0;
          return (
            <li
              key={s.indication}
              className="flex items-center justify-between gap-3 font-body text-caption"
            >
              <span className="flex items-center gap-2 truncate">
                <span
                  aria-hidden="true"
                  className="inline-block size-2.5 rounded-sm"
                  style={{
                    backgroundColor:
                      s.indication === "Other"
                        ? OTHER_COLOR
                        : PALETTE[i % PALETTE.length],
                  }}
                />
                <span className="truncate text-ink-700">{s.indication}</span>
              </span>
              <span
                className="text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
