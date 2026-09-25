"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartLegend, type LegendSeries } from "@/components/charts/chart-legend";
import { ChartTooltip, type TooltipRow } from "@/components/charts/chart-tooltip";
import {
  AXIS_LINE,
  AXIS_TICK,
  GRID_STROKE,
  SURFACE,
  seriesColor,
} from "@/components/charts/chart-tokens";
import { useChartLegend } from "@/components/charts/use-chart-legend";
import type { EquityPoint } from "@/lib/api/types";
import type { EquityBar } from "@/lib/portfolio/equity";
import { hasLoss, toEquityBars } from "@/lib/portfolio/equity";
import {
  formatCompactCurrency,
  formatCurrency,
  formatMonthLong,
  formatMonthReference,
} from "@/lib/format";

const INVESTED_COLOR = seriesColor(0);
const GAIN_COLOR = seriesColor(11);
const LOSS_COLOR = "var(--color-negative)";

const BASE_KEY = "base";
const GAIN_KEY = "surplus";
const LOSS_KEY = "shortfall";

const STACK = "equity";

const GAIN_SERIES: LegendSeries = {
  key: GAIN_KEY,
  label: "Ganho de capital",
  color: GAIN_COLOR,
};

const LOSS_SERIES: LegendSeries = {
  key: LOSS_KEY,
  label: "Perda de capital",
  color: LOSS_COLOR,
};

const INVESTED_SERIES: LegendSeries = {
  key: BASE_KEY,
  label: "Valor aplicado",
  color: INVESTED_COLOR,
};

const MIN_TICK_GAP = 36;

const BRUSH_MIN_POINTS = 8;

const PLOT_HEIGHT = 280;

const BRUSH_HEIGHT = 30;

const ANIMATION_DURATION = 600;

const MAX_BAR_SIZE = 28;

const BAR_GAP = 2;

export function EquityChart({ months }: { months: EquityPoint[] }) {
  const data = useMemo(() => toEquityBars(months), [months]);

  const series = [
    INVESTED_SERIES,
    GAIN_SERIES,
    ...(hasLoss(data) ? [LOSS_SERIES] : []),
  ];

  const legend = useChartLegend(series.map((item) => item.key));

  const zoomable = data.length >= BRUSH_MIN_POINTS;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <ChartLegend series={series} state={legend} />
        <p className="px-2 text-xs text-subtle-foreground">
          {zoomable
            ? "Clique na legenda para isolar uma série · arraste a faixa abaixo para recortar o período"
            : "Clique na legenda para isolar uma série"}
        </p>
      </div>

      <ResponsiveContainer
        width="100%"
        height={zoomable ? PLOT_HEIGHT + BRUSH_HEIGHT : PLOT_HEIGHT}
      >
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
        >
          <CartesianGrid stroke={GRID_STROKE} strokeWidth={1} vertical={false} />

          <XAxis
            dataKey="reference"
            interval="preserveStartEnd"
            minTickGap={MIN_TICK_GAP}
            tickLine={false}
            axisLine={AXIS_LINE}
            tick={AXIS_TICK}
            tickFormatter={formatMonthReference}
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
            content={<EquityTooltip hidden={legend.hidden} />}
          />

          <Bar
            dataKey={BASE_KEY}
            name="Valor aplicado"
            stackId={STACK}
            hide={legend.isHidden(BASE_KEY)}
            fill={INVESTED_COLOR}
            fillOpacity={legend.opacityOf(BASE_KEY)}
            stroke={SURFACE}
            strokeWidth={BAR_GAP}
            maxBarSize={MAX_BAR_SIZE}
            animationDuration={ANIMATION_DURATION}
          />

          <Bar
            dataKey={GAIN_KEY}
            name="Ganho de capital"
            stackId={STACK}
            hide={legend.isHidden(GAIN_KEY)}
            fill={GAIN_COLOR}
            fillOpacity={legend.opacityOf(GAIN_KEY)}
            stroke={SURFACE}
            strokeWidth={BAR_GAP}
            maxBarSize={MAX_BAR_SIZE}
            animationDuration={ANIMATION_DURATION}
          />

          <Bar
            dataKey={LOSS_KEY}
            name="Perda de capital"
            stackId={STACK}
            hide={legend.isHidden(LOSS_KEY)}
            fill={LOSS_COLOR}
            fillOpacity={legend.opacityOf(LOSS_KEY)}
            stroke={SURFACE}
            strokeWidth={BAR_GAP}
            maxBarSize={MAX_BAR_SIZE}
            animationDuration={ANIMATION_DURATION}
          />

          {zoomable ? (
            <Brush
              dataKey="reference"
              height={BRUSH_HEIGHT - 8}
              travellerWidth={8}
              gap={1}
              stroke="var(--color-axis)"
              fill="var(--color-muted)"
              tickFormatter={formatMonthReference}
              ariaLabel="Recorte do período exibido"
            />
          ) : null}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EquityTooltip({
  active,
  payload,
  hidden,
}: {
  active?: boolean;
  payload?: { payload: EquityBar }[];
  hidden?: ReadonlySet<string>;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) return null;

  const visible = (key: string) => !hidden?.has(key);

  const rows: TooltipRow[] = [
    {
      key: "equity",
      label: "Patrimônio",
      value: formatCurrency(point.equity),
    },
    ...(visible(GAIN_KEY) && point.surplus > 0
      ? [
          {
            key: GAIN_KEY,
            label: "Ganho de capital",
            value: formatCurrency(point.surplus),
            color: GAIN_COLOR,
          },
        ]
      : []),
    ...(visible(LOSS_KEY) && point.shortfall > 0
      ? [
          {
            key: LOSS_KEY,
            label: "Perda de capital",
            value: formatCurrency(point.shortfall),
            color: LOSS_COLOR,
          },
        ]
      : []),
    ...(visible(BASE_KEY)
      ? [
          {
            key: BASE_KEY,
            label: "Valor aplicado",
            value: formatCurrency(point.invested),
            color: INVESTED_COLOR,
          },
        ]
      : []),
    {
      key: "earnings",
      label: "Proventos acumulados",
      value: formatCurrency(point.earnings),
      muted: true,
    },
  ];

  return <ChartTooltip title={formatMonthLong(point.reference)} rows={rows} />;
}
