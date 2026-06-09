"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TrendPoint } from "@/lib/analytics";

export function AccuracyTrendChart({
  data,
  yDomain,
  yLabel = "Accuracy %",
}: {
  data: TrendPoint[];
  yDomain?: [number, number];
  yLabel?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="empty-state py-8">Not enough data for a trend chart yet.</div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e4" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => v.slice(5)}
          />
          <YAxis
            domain={yDomain ?? [0, 100]}
            tick={{ fontSize: 11 }}
            width={36}
          />
          <Tooltip
            formatter={(value) => [`${value}${yLabel.includes("%") ? "%" : ""}`, yLabel]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2f6f62"
            strokeWidth={2}
            dot={{ r: 3, fill: "#2f6f62" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleTrendChart({
  data,
  label,
  domain,
}: {
  data: TrendPoint[];
  label: string;
  domain?: [number, number];
}) {
  return (
    <AccuracyTrendChart
      data={data}
      yDomain={domain}
      yLabel={label}
    />
  );
}
