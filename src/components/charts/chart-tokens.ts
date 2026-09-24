export const SERIES_HUES = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
  "var(--color-chart-9)",
  "var(--color-chart-10)",
  "var(--color-chart-11)",
] as const;

const HUE_COUNT = SERIES_HUES.length;

const SHADE_WEIGHT = 74;

const SHADE_TARGETS = [
  null,
  "var(--color-foreground)",
  "var(--color-background)",
] as const;

export const SERIES_LIMIT = HUE_COUNT * SHADE_TARGETS.length;

export function seriesColor(index: number) {
  const position = ((index % SERIES_LIMIT) + SERIES_LIMIT) % SERIES_LIMIT;
  const hue = SERIES_HUES[position % HUE_COUNT] as string;
  const target = SHADE_TARGETS[Math.floor(position / HUE_COUNT)];

  if (!target) return hue;

  return `color-mix(in oklab, ${hue} ${SHADE_WEIGHT}%, ${target})`;
}

export const AXIS_LINE = { stroke: "var(--color-axis)", strokeWidth: 1 };

export const AXIS_TICK = {
  fill: "var(--color-subtle-foreground)",
  fontSize: 11,
};

export const GRID_STROKE = "var(--color-grid)";

export const SURFACE = "var(--color-surface)";
