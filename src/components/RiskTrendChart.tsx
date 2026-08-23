"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function RiskTrendChart({
  data,
  reducedMotion,
}: {
  data: { date: string; score: number }[];
  reducedMotion: boolean | null;
}) {
  return (
    <ResponsiveContainer>
      <AreaChart
        data={data}
        margin={{ left: -20, right: 8, top: 8, bottom: 0 }}
      >
        <defs>
          <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0"
              stopColor="rgb(var(--accent))"
              stopOpacity={0.32}
            />
            <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgb(var(--line)/.35)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "rgb(var(--muted))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={{ fill: "rgb(var(--muted))", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "rgb(var(--surface))",
            border: "1px solid rgb(var(--line))",
            borderRadius: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="rgb(var(--accent))"
          fill="url(#riskFill)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "rgb(var(--accent))" }}
          isAnimationActive={!reducedMotion}
          animationDuration={700}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
