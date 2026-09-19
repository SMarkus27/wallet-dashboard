"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  seriesColor,
} from "@/components/charts/chart-tokens";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useMediaQuery } from "@/lib/use-media-query";

const BAR_COLOR = seriesColor(0);
const ROW_HEIGHT = 30;
const MIN_HEIGHT = 140;
const LABEL_WIDTH = 156;
const COMPACT_LABEL_WIDTH = 104;
const COMPACT_QUERY = "(max-width: 640px)";
const MAX_BAR_SIZE = 20;
const END_RADIUS: [number, number, number, number] = [0, 4, 4, 0];

export type ShareDatum = {
  key: string;
  label: string;
  caption?: string | null;
  percentage: number;
  idealPercentage?: number | null;
  value: number;
};

export function ShareBarChart({
  data,
  measure,
  emptyMessage = "Sem posições para exibir.",
}: {
  data: ShareDatum[];
  measure: string;
  emptyMessage?: string;
}) {
  const compact = useMediaQuery(COMPACT_QUERY);

  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(MIN_HEIGHT, data.length * ROW_HEIGHT + 32)}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: compact ? 44 : 56, bottom: 0, left: 0 }}
      >
        <CartesianGrid stroke={GRID_STROKE} strokeWidth={1} horizontal={false} />

        <XAxis
          type="number"
          tickLine={false}
          axisLine={AXIS_LINE}
          tick={AXIS_TICK}
          tickFormatter={(value: number) => `${value}%`}
        />

        <YAxis
          type="category"
          dataKey="label"
          width={compact ? COMPACT_LABEL_WIDTH : LABEL_WIDTH}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          interval={0}
        />

        <Tooltip
          cursor={{ fill: "var(--color-accent)", opacity: 0.5 }}
          content={<ShareTooltip measure={measure} />}
        />

        <Bar
          dataKey="percentage"
          maxBarSize={MAX_BAR_SIZE}
          radius={END_RADIUS}
          isAnimationActive={false}
          label={{
            position: "right",
            fill: "var(--color-muted-foreground)",
            fontSize: 11,
            formatter: (value: unknown) => formatPercent(value as number),
          }}
        >
          {data.map((item) => (
            <Cell key={item.key} fill={BAR_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ShareTooltip({
  active,
  payload,
  measure,
}: {
  active?: boolean;
  payload?: { payload: ShareDatum }[];
  measure: string;
}) {
  const item = payload?.[0]?.payload;

  if (!active || !item) return null;

  return (
    <ChartTooltip
      title={item.label}
      rows={[
        ...(item.caption
          ? [{ key: "caption", label: "Classe", value: item.caption, muted: true }]
          : []),
        {
          key: "real",
          label: measure,
          value: formatPercent(item.percentage),
          color: BAR_COLOR,
        },
        ...(item.idealPercentage === null || item.idealPercentage === undefined
          ? []
          : [
              {
                key: "ideal",
                label: "Meta",
                value: formatPercent(item.idealPercentage),
                muted: true,
              },
            ]),
        { key: "value", label: "Saldo", value: formatCurrency(item.value) },
      ]}
    />
  );
}
