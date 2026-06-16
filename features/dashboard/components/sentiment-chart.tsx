"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { SentimentBreakdown } from "@/types";

interface SentimentChartProps {
  data: SentimentBreakdown;
}

type SentimentEntry = {
  name: string;
  value: number;
  color: string;
};

const SENTIMENT_CONFIG = [
  { key: "positive" as const, label: "Positive", color: "#22c55e" },
  { key: "negative" as const, label: "Negative", color: "#ef4444" },
  { key: "neutral"  as const, label: "Neutral",  color: "#71717a" },
  { key: "mixed"    as const, label: "Mixed",     color: "#f59e0b" },
];

// Custom tooltip — avoids Recharts default styling that ignores CSS variables
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload?.length || !payload[0]) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">{name}</p>
      <p className="text-muted-foreground">{value}%</p>
    </div>
  );
}

export function SentimentChart({ data }: SentimentChartProps) {
  const chartData: SentimentEntry[] = SENTIMENT_CONFIG.map(
    ({ key, label, color }) => ({ name: label, value: data[key], color })
  ).filter((d) => d.value > 0);

  const dominant = chartData.reduce<SentimentEntry | null>(
    (prev, curr) => (!prev || curr.value > prev.value ? curr : prev),
    null
  );

  return (
    <div className="space-y-4">
      {/* Donut with center label overlay */}
      <div className="relative h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label — absolute overlay aligned to cx/cy */}
        {dominant && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold tabular-nums leading-none">
              {dominant.value}%
            </p>
            <p className="mt-1 text-xs capitalize text-muted-foreground">
              {dominant.name}
            </p>
          </div>
        )}
      </div>

      {/* Custom legend — cleaner than Recharts default */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-medium tabular-nums text-foreground">
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}