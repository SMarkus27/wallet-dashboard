"use client";

import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BarShapeProps } from "recharts";

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
import type { Granularity, SeriesPoint } from "@/lib/portfolio/earnings";
import {
  formatCompactCurrency,
  formatCurrency,
  formatMonthLong,
  formatMonthReference,
} from "@/lib/format";

const DIVIDEND_COLOR = seriesColor(0);
const JCP_COLOR = seriesColor(1);

const DIVIDEND_KEY = "dividends";
const JCP_KEY = "interestOnEquity";

const SERIES: readonly LegendSeries[] = [
  { key: DIVIDEND_KEY, label: "Dividendos", color: DIVIDEND_COLOR },
  { key: JCP_KEY, label: "JCP", color: JCP_COLOR },
];

const SERIES_KEYS = SERIES.map((item) => item.key);

const MIN_TICK_GAP = 24;
const MAX_BAR_SIZE = 24;
const GAP = 2;
const CAP_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

const BRUSH_MIN_POINTS = 14;

const PLOT_HEIGHT = 260;

const BRUSH_HEIGHT = 30;

const ANIMATION_DURATION = 600;

const DIMMED_OPACITY = 0.28;

export function EarningsChart({
  points,
  granularity,
  selected = null,
  onSelect,
}: {
  points: SeriesPoint[];
  granularity: Granularity;
  selected?: string | null;
  onSelect?: (reference: string | null) => void;
}) {
  const legend = useChartLegend(SERIES_KEYS);

  const label = (reference: string) =>
    granularity === "YEAR" ? reference : formatMonthReference(reference);

  const longLabel = (reference: string) =>
    granularity === "YEAR" ? reference : formatMonthLong(reference);

  const zoomable = points.length >= BRUSH_MIN_POINTS;

  const shapeOf = (key: string, color: string) =>
    function BucketShape(props: BarShapeProps) {
      const reference = (props.payload as SeriesPoint | undefined)?.reference;
      const dimmed = selected !== null && selected !== reference;

      return (
        <Rectangle
          {...props}
          fill={color}
          fillOpacity={legend.opacityOf(key) * (dimmed ? DIMMED_OPACITY : 1)}
        />
      );
    };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <ChartLegend series={SERIES} state={legend} />
        {onSelect ? (
          <p className="px-2 text-xs text-subtle-foreground">
            Clique em uma barra para filtrar o histórico abaixo
          </p>
        ) : null}
      </div>

      <ResponsiveContainer
        width="100%"
        height={zoomable ? PLOT_HEIGHT + BRUSH_HEIGHT : PLOT_HEIGHT}
      >
        <BarChart
          data={points}
          margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
          className={onSelect ? "cursor-pointer" : undefined}
          onClick={(state) => {
            if (!onSelect) return;

            const reference =
              typeof state.activeLabel === "string" ? state.activeLabel : null;

            onSelect(reference === selected ? null : reference);
          }}
        >
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
            content={
              <EarningsTooltip
                title={longLabel}
                hidden={legend.hidden}
                selected={selected}
                selectable={Boolean(onSelect)}
              />
            }
          />

          <Bar
            dataKey={DIVIDEND_KEY}
            name="Dividendos"
            stackId="earnings"
            hide={legend.isHidden(DIVIDEND_KEY)}
            fill={DIVIDEND_COLOR}
            fillOpacity={legend.opacityOf(DIVIDEND_KEY)}
            stroke={SURFACE}
            strokeWidth={GAP}
            maxBarSize={MAX_BAR_SIZE}
            radius={CAP_RADIUS}
            shape={shapeOf(DIVIDEND_KEY, DIVIDEND_COLOR)}
            activeBar={{ fillOpacity: 1 }}
            animationDuration={ANIMATION_DURATION}
          />

          <Bar
            dataKey={JCP_KEY}
            name="JCP"
            stackId="earnings"
            hide={legend.isHidden(JCP_KEY)}
            fill={JCP_COLOR}
            fillOpacity={legend.opacityOf(JCP_KEY)}
            stroke={SURFACE}
            strokeWidth={GAP}
            maxBarSize={MAX_BAR_SIZE}
            radius={CAP_RADIUS}
            shape={shapeOf(JCP_KEY, JCP_COLOR)}
            activeBar={{ fillOpacity: 1 }}
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
              tickFormatter={label}
              ariaLabel="Recorte do período exibido"
            />
          ) : null}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EarningsTooltip({
  active,
  payload,
  title,
  hidden,
  selected,
  selectable,
}: {
  active?: boolean;
  payload?: { payload: SeriesPoint }[];
  title: (reference: string) => string;
  hidden?: ReadonlySet<string>;
  selected?: string | null;
  selectable?: boolean;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) return null;

  const visible = (key: string) => !hidden?.has(key);

  const rows: TooltipRow[] = [
    ...(visible(DIVIDEND_KEY)
      ? [
          {
            key: DIVIDEND_KEY,
            label: "Dividendos",
            value: formatCurrency(point.dividends),
            color: DIVIDEND_COLOR,
          },
        ]
      : []),
    ...(visible(JCP_KEY)
      ? [
          {
            key: JCP_KEY,
            label: "JCP",
            value: formatCurrency(point.interestOnEquity),
            color: JCP_COLOR,
          },
        ]
      : []),
  ];

  return (
    <ChartTooltip
      title={title(point.reference)}
      rows={rows}
      footer={
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(point.total)}
            </span>
          </div>
          {selectable ? (
            <span className="text-subtle-foreground">
              {selected === point.reference
                ? "Clique para limpar o filtro"
                : "Clique para filtrar o histórico"}
            </span>
          ) : null}
        </div>
      }
    />
  );
}
