"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VolumeBucket } from "@/lib/admin/dashboard";

interface VolumeTimeSeriesChartProps {
  data: VolumeBucket[];
  bucket: "day" | "week" | "month";
}

// Treatment volume over time. Static render (no entrance animation) so
// reduced-motion is respected by default. Tooltip shows exact count for
// the hovered bucket.
export function VolumeTimeSeriesChart({
  data,
  bucket,
}: VolumeTimeSeriesChartProps) {
  const formatted = data.map((d) => ({
    bucket: d.bucket,
    label: formatBucket(d.bucket, bucket),
    count: d.count,
  }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formatted}
          margin={{ top: 10, right: 16, bottom: 0, left: -12 }}
        >
          <CartesianGrid stroke="#E0D8C9" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#5A6470", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#E0D8C9" }}
          />
          <YAxis
            tick={{ fill: "#5A6470", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: "#C9B68F", strokeWidth: 1 }}
            contentStyle={{
              backgroundColor: "#FAF7F2",
              border: "1px solid #E0D8C9",
              borderRadius: "4px",
              fontFamily: "var(--font-body), Inter, sans-serif",
              fontSize: 12,
            }}
            labelStyle={{ color: "#0F1419", fontWeight: 500 }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3F5A82"
            strokeWidth={2}
            dot={{ r: 3, fill: "#3F5A82", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#3F5A82", strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatBucket(iso: string, bucket: "day" | "week" | "month"): string {
  try {
    const d = new Date(iso);
    if (bucket === "month") {
      return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    }
    if (bucket === "week") {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
