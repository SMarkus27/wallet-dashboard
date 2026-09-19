export const SERIES_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
] as const;

export const SERIES_LIMIT = SERIES_COLORS.length;

export function seriesColor(index: number) {
  return SERIES_COLORS[index % SERIES_LIMIT] as string;
}

export const AXIS_LINE = { stroke: "var(--color-axis)", strokeWidth: 1 };

export const AXIS_TICK = {
  fill: "var(--color-subtle-foreground)",
  fontSize: 11,
};

export const GRID_STROKE = "var(--color-grid)";

export const SURFACE = "var(--color-surface)";
