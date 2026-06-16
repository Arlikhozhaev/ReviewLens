"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ThemeAnalysis } from "@/features/analysis/types";

interface ThemeBarChartProps {
  themes: ThemeAnalysis[];
}

type ChartEntry = {
  name: string;
  fullName: string;
  count: number;
  pct: number;
  color: string;
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#22c55e",
  negative: "#ef4444",
  neutral:  "#71717a",
  mixed:    "#f59e0b",
};

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartEntry }>;
}) {
  if (!active || !payload?.length || !payload[0]) return null;
  const { value, payload: d } = payload[0];
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="mb-0.5 max-w-[200px] font-medium text-foreground">
        {d.fullName}
      </p>
      <p className="text-muted-foreground">
        {value} reviews · {d.pct}%
      </p>
    </div>
  );
}

export function ThemeBarChart({ themes }: ThemeBarChartProps) {
  const chartData: ChartEntry[] = [...themes]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 8)
    .map((t) => ({
      name:     t.label.length > 22 ? `${t.label.slice(0, 22)}…` : t.label,
      fullName: t.label,
      count:    t.reviewCount,
      pct:      Math.round(t.percentage),
      color:    SENTIMENT_COLORS[t.sentiment] ?? "#71717a",
    }));

  // Dynamic height so bars never look squashed regardless of cluster count
  const chartHeight = Math.max(180, chartData.length * 36);

  return (
    <div style={{ height: chartHeight }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 44, bottom: 0, left: 4 }}
          barCategoryGap="28%"
        >
          <XAxis
            type="number"
            tick={{ fontSize: 11, opacity: 0.5 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={124}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<BarTooltip />}
            cursor={{ fill: "currentColor", opacity: 0.04 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.82} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}