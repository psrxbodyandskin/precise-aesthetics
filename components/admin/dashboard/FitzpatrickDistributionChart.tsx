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
import type { FitzpatrickBar } from "@/lib/admin/dashboard";

interface FitzpatrickDistributionChartProps {
  bars: FitzpatrickBar[];
}

// Six horizontal bars (I-VI). Reinforces the brand thesis: consistent
// outcomes across the Fitzpatrick spectrum. Chart frame handles the
// empty state.
export function FitzpatrickDistributionChart({
  bars,
}: FitzpatrickDistributionChartProps) {
  const total = bars.reduce((acc, b) => acc + b.count, 0);
  const data = bars.map((b) => ({
    name: `Type ${b.fitzpatrick}`,
    count: b.count,
    pct: total > 0 ? Math.round((b.count / total) * 100) : 0,
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
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
            width={64}
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
            formatter={((value: unknown, _name: unknown, item: unknown) => {
              const v = typeof value === "number" ? value : Number(value ?? 0);
              const pct =
                (item as { payload?: { pct?: number } })?.payload?.pct ?? 0;
              return [`${v} (${pct}%)`, "Treatments"];
            }) as never}
          />
          <Bar
            dataKey="count"
            fill="#3F5A82"
            isAnimationActive={false}
            radius={[0, 2, 2, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
