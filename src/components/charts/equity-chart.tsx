"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
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
import type { EquityPoint } from "@/lib/api/types";
import {
  formatCompactCurrency,
  formatCurrency,
  formatMonthLong,
  formatMonthReference,
  toNumber,
} from "@/lib/format";

const INVESTED_COLOR = seriesColor(0);
const EQUITY_COLOR = seriesColor(1);

const MAX_TICKS = 8;

type Point = {
  reference: string;
  invested: number;
  equity: number;
  gain: number;
  earnings: number;
};

export function EquityChart({ months }: { months: EquityPoint[] }) {
  const data = useMemo<Point[]>(
    () =>
      months.map((month) => ({
        reference: month.reference,
        invested: toNumber(month.invested_amount),
        equity: toNumber(month.total_equity),
        gain: toNumber(month.capital_gain),
        earnings: toNumber(month.earnings),
      })),
    [months],
  );

  const interval = Math.max(0, Math.ceil(data.length / MAX_TICKS) - 1);

  return (
    <div className="flex flex-col gap-3">
      <ChartLegend />

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={data}
          margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
        >
          <CartesianGrid stroke={GRID_STROKE} strokeWidth={1} vertical={false} />

          <XAxis
            dataKey="reference"
            interval={interval}
            tickLine={false}
            axisLine={AXIS_LINE}
            tick={AXIS_TICK}
            tickFormatter={formatMonthReference}
            minTickGap={8}
          />

          <YAxis
            width={64}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            tickFormatter={(value: number) => formatCompactCurrency(value)}
          />

          <Tooltip
            cursor={{ stroke: "var(--color-axis)", strokeWidth: 1 }}
            content={<EquityTooltip />}
          />

          <Area
            type="monotone"
            dataKey="invested"
            name="Valor aplicado"
            stroke={INVESTED_COLOR}
            strokeWidth={2}
            fill={INVESTED_COLOR}
            fillOpacity={0.14}
            activeDot={{ r: 4, strokeWidth: 2, stroke: SURFACE }}
          />

          <Line
            type="monotone"
            dataKey="equity"
            name="Patrimônio"
            stroke={EQUITY_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: SURFACE }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <LegendItem color={EQUITY_COLOR} label="Patrimônio" />
      <LegendItem color={INVESTED_COLOR} label="Valor aplicado" />
    </ul>
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

function EquityTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) return null;

  return (
    <ChartTooltip
      title={formatMonthLong(point.reference)}
      rows={[
        {
          key: "equity",
          label: "Patrimônio",
          value: formatCurrency(point.equity),
          color: EQUITY_COLOR,
        },
        {
          key: "invested",
          label: "Valor aplicado",
          value: formatCurrency(point.invested),
          color: INVESTED_COLOR,
        },
        {
          key: "gain",
          label: "Ganho de capital",
          value: formatCurrency(point.gain),
          muted: true,
        },
        {
          key: "earnings",
          label: "Proventos acumulados",
          value: formatCurrency(point.earnings),
          muted: true,
        },
      ]}
    />
  );
}
