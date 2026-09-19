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

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import {
  AXIS_LINE,
  AXIS_TICK,
  GRID_STROKE,
  SURFACE,
  seriesColor,
} from "@/components/charts/chart-tokens";
import type { Granularity, SeriesPoint } from "@/lib/portfolio/earnings";
import {
  formatCompactCurrency,
  formatCurrency,
  formatMonthLong,
  formatMonthReference,
} from "@/lib/format";

const DIVIDEND_COLOR = seriesColor(0);
const JCP_COLOR = seriesColor(1);

const MIN_TICK_GAP = 24;
const MAX_BAR_SIZE = 24;
const GAP = 2;
const CAP_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

export function EarningsChart({
  points,
  granularity,
}: {
  points: SeriesPoint[];
  granularity: Granularity;
}) {
  const label = (reference: string) =>
    granularity === "YEAR" ? reference : formatMonthReference(reference);

  const longLabel = (reference: string) =>
    granularity === "YEAR" ? reference : formatMonthLong(reference);

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <LegendItem color={DIVIDEND_COLOR} label="Dividendos" />
        <LegendItem color={JCP_COLOR} label="JCP" />
      </ul>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeWidth={1} vertical={false} />

          <XAxis
            dataKey="reference"
            interval="preserveStartEnd"
            minTickGap={MIN_TICK_GAP}
            tickLine={false}
            axisLine={AXIS_LINE}
            tick={AXIS_TICK}
            tickFormatter={label}
          />

          <YAxis
            width={64}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            tickFormatter={(value: number) => formatCompactCurrency(value)}
          />

          <Tooltip
            cursor={{ fill: "var(--color-accent)", opacity: 0.5 }}
            content={<EarningsTooltip title={longLabel} />}
          />

          <Bar
            dataKey="dividends"
            name="Dividendos"
            stackId="earnings"
            fill={DIVIDEND_COLOR}
            stroke={SURFACE}
            strokeWidth={GAP}
            maxBarSize={MAX_BAR_SIZE}
            radius={CAP_RADIUS}
            isAnimationActive={false}
          />

          <Bar
            dataKey="interestOnEquity"
            name="JCP"
            stackId="earnings"
            fill={JCP_COLOR}
            stroke={SURFACE}
            strokeWidth={GAP}
            maxBarSize={MAX_BAR_SIZE}
            radius={CAP_RADIUS}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="size-2 rounded-[2px]"
        style={{ backgroundColor: color }}
      />
      {label}
    </li>
  );
}

function EarningsTooltip({
  active,
  payload,
  title,
}: {
  active?: boolean;
  payload?: { payload: SeriesPoint }[];
  title: (reference: string) => string;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) return null;

  return (
    <ChartTooltip
      title={title(point.reference)}
      rows={[
        {
          key: "dividends",
          label: "Dividendos",
          value: formatCurrency(point.dividends),
          color: DIVIDEND_COLOR,
        },
        {
          key: "jcp",
          label: "JCP",
          value: formatCurrency(point.interestOnEquity),
          color: JCP_COLOR,
        },
      ]}
      footer={
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium tabular-nums">
            {formatCurrency(point.total)}
          </span>
        </div>
      }
    />
  );
}
