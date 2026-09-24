"use client";

import { useMemo } from "react";
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
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
import {
  formatCompactCurrency,
  formatCurrency,
  formatMonthLong,
  formatMonthReference,
  toNumber,
} from "@/lib/format";

const INVESTED_COLOR = seriesColor(0);
const EQUITY_COLOR = seriesColor(1);

const EQUITY_KEY = "equity";
const INVESTED_KEY = "invested";

const SERIES: readonly LegendSeries[] = [
  { key: EQUITY_KEY, label: "Patrimônio", color: EQUITY_COLOR, shape: "line" },
  { key: INVESTED_KEY, label: "Valor aplicado", color: INVESTED_COLOR },
];

const SERIES_KEYS = SERIES.map((item) => item.key);

const MIN_TICK_GAP = 36;

const MIN_POINTS = 2;

const BRUSH_MIN_POINTS = 8;

const PLOT_HEIGHT = 280;

const BRUSH_HEIGHT = 30;

const ANIMATION_DURATION = 600;

const AREA_FILL_OPACITY = 0.14;

const ACTIVE_DOT_RADIUS = 4;

type Point = {
  reference: string;
  invested: number;
  equity: number;
  gain: number;
  earnings: number;
};

export function EquityChart({ months }: { months: EquityPoint[] }) {
  const legend = useChartLegend(SERIES_KEYS);

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

  // Um mês só não é evolução: dois pontos soltos num gráfico de 280px não
  // dizem nada além do que os números ao lado já dizem.
  if (data.length < MIN_POINTS) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        A evolução aparece a partir do segundo mês de histórico.
      </p>
    );
  }

  const zoomable = data.length >= BRUSH_MIN_POINTS;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <ChartLegend series={SERIES} state={legend} />
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
        <ComposedChart
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
            cursor={{ stroke: "var(--color-axis)", strokeWidth: 1 }}
            content={<EquityTooltip hidden={legend.hidden} />}
          />

          <Area
            type="monotone"
            dataKey={INVESTED_KEY}
            name="Valor aplicado"
            hide={legend.isHidden(INVESTED_KEY)}
            stroke={INVESTED_COLOR}
            strokeWidth={2}
            strokeOpacity={legend.opacityOf(INVESTED_KEY)}
            fill={INVESTED_COLOR}
            fillOpacity={AREA_FILL_OPACITY * legend.opacityOf(INVESTED_KEY)}
            activeDot={{
              r: ACTIVE_DOT_RADIUS,
              strokeWidth: 2,
              stroke: SURFACE,
            }}
            animationDuration={ANIMATION_DURATION}
          />

          <Line
            type="monotone"
            dataKey={EQUITY_KEY}
            name="Patrimônio"
            hide={legend.isHidden(EQUITY_KEY)}
            stroke={EQUITY_COLOR}
            strokeWidth={2}
            strokeOpacity={legend.opacityOf(EQUITY_KEY)}
            dot={false}
            activeDot={{
              r: ACTIVE_DOT_RADIUS,
              strokeWidth: 2,
              stroke: SURFACE,
            }}
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
        </ComposedChart>
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
  payload?: { payload: Point }[];
  hidden?: ReadonlySet<string>;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) return null;

  const visible = (key: string) => !hidden?.has(key);

  const rows: TooltipRow[] = [
    ...(visible(EQUITY_KEY)
      ? [
          {
            key: EQUITY_KEY,
            label: "Patrimônio",
            value: formatCurrency(point.equity),
            color: EQUITY_COLOR,
          },
        ]
      : []),
    ...(visible(INVESTED_KEY)
      ? [
          {
            key: INVESTED_KEY,
            label: "Valor aplicado",
            value: formatCurrency(point.invested),
            color: INVESTED_COLOR,
          },
        ]
      : []),
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
  ];

  return <ChartTooltip title={formatMonthLong(point.reference)} rows={rows} />;
}
