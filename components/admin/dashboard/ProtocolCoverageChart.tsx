"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProtocolCoverageRow } from "@/lib/admin/dashboard";

interface ProtocolCoverageChartProps {
  rows: ProtocolCoverageRow[];
}

const FITZ_COLORS: Record<string, string> = {
  I: "#E0D8C9",
  II: "#C9B68F",
  III: "#A8C8E8",
  IV: "#8FA8D2",
  V: "#3F5A82",
  VI: "#1F2F4F",
  unknown: "#7B8AA3",
};

const FITZ_ORDER = ["I", "II", "III", "IV", "V", "VI", "unknown"] as const;

// Stacked bar — one row per protocol, segments by Fitzpatrick type.
// Surfaces which protocols are reaching across skin types in practice.
export function ProtocolCoverageChart({ rows }: ProtocolCoverageChartProps) {
  // Recharts wants flat data — convert into objects keyed by fitz type
  const data = rows.map((r) => {
    const obj: Record<string, string | number> = { name: r.title };
    for (const f of FITZ_ORDER) {
      obj[f] = r.by_fitzpatrick?.[f] ?? 0;
    }
    return obj;
  });

  // Only render Fitz keys that have ANY data (keeps the legend clean)
  const presentFitz = FITZ_ORDER.filter((f) =>
    rows.some((r) => (r.by_fitzpatrick?.[f] ?? 0) > 0),
  );

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid
            stroke="#E0D8C9"
            strokeDasharray="3 6"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: "#5A6470", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fill: "#0F1419", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#E0D8C9" }}
          />
          <Tooltip
            cursor={{ fill: "#F4F0E8" }}
            contentStyle={{
              backgroundColor: "#FAF7F2",
              border: "1px solid #E0D8C9",
              borderRadius: "4px",
              fontFamily: "var(--font-body), Inter, sans-serif",
              fontSize: 12,
            }}
            labelStyle={{ color: "#0F1419", fontWeight: 500 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-body), Inter, sans-serif" }}
          />
          {presentFitz.map((f) => (
            <Bar
              key={f}
              dataKey={f}
              stackId="fitz"
              fill={FITZ_COLORS[f]}
              isAnimationActive={false}
              name={f === "unknown" ? "Unknown" : `Fitz ${f}`}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
