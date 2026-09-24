"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { SURFACE, seriesColor } from "@/components/charts/chart-tokens";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_SLICES = 6;

const OTHER_KEY = "outros";

const OTHER_LABEL = "Outros";

const CHART_HEIGHT = 200;

const BASE_RADIUS = "90%";

const INNER_RADIUS = "58%";

const DIMMED_OPACITY = 0.3;

const RING_GAP = 2;

const RING_STROKE = 2;

const ANIMATION_DURATION = 350;

export type TargetSlice = {
  key: string;
  label: string;
  caption?: string | null;
  percentage: number;
};

type Painted = TargetSlice & { color: string };

export function TargetsDonut({
  data,
  total,
  totalLabel,
  emptyMessage,
}: {
  data: TargetSlice[];
  total: number;
  totalLabel: string;
  emptyMessage: string;
}) {
  const painted = useMemo(() => paint(data), [data]);

  const [hovered, setHovered] = useState<string | null>(null);

  const active = painted.find((slice) => slice.key === hovered) ?? null;

  if (painted.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative w-full sm:w-64" style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={painted}
              dataKey="percentage"
              nameKey="label"
              innerRadius={INNER_RADIUS}
              outerRadius={BASE_RADIUS}
              paddingAngle={RING_GAP}
              stroke={SURFACE}
              strokeWidth={RING_STROKE}
              animationDuration={ANIMATION_DURATION}
              onMouseEnter={(_, index) => setHovered(painted[index]?.key ?? null)}
              onMouseLeave={() => setHovered(null)}
            >
              {painted.map((slice) => (
                <Cell
                  key={slice.key}
                  fill={slice.color}
                  fillOpacity={
                    hovered === null || hovered === slice.key ? 1 : DIMMED_OPACITY
                  }
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">
            {active ? active.label : totalLabel}
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {formatPercent(active ? active.percentage : total)}
          </span>
        </div>
      </div>

      <ul className="flex flex-1 flex-col gap-1.5">
        {painted.map((slice) => (
          <li
            key={slice.key}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors",
              hovered === slice.key ? "bg-muted" : null,
            )}
            onMouseEnter={() => setHovered(slice.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="flex-1 truncate">
              {slice.label}
              {slice.caption ? (
                <span className="text-muted-foreground"> · {slice.caption}</span>
              ) : null}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {formatPercent(slice.percentage)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function paint(data: TargetSlice[]): Painted[] {
  const ordered = [...data]
    .filter((slice) => slice.percentage > 0)
    .sort((left, right) => right.percentage - left.percentage);

  const visible = ordered.slice(0, MAX_SLICES);
  const rest = ordered.slice(MAX_SLICES);

  if (rest.length > 0) {
    visible.push({
      key: OTHER_KEY,
      label: OTHER_LABEL,
      caption: `${rest.length} itens`,
      percentage: rest.reduce((sum, slice) => sum + slice.percentage, 0),
    });
  }

  return visible.map((slice, index) => ({ ...slice, color: seriesColor(index) }));
}
