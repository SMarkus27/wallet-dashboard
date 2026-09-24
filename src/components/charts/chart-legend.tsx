"use client";

import { cn } from "@/lib/utils";

export type LegendSeries = {
  key: string;
  label: string;
  color: string;
  shape?: "rect" | "line";
};

export function ChartLegend({
  series,
  state,
  label = "Séries do gráfico",
}: {
  series: readonly LegendSeries[];
  state: {
    focused: string | null;
    toggle: (key: string) => void;
    focus: (key: string | null) => void;
    isHidden: (key: string) => boolean;
  };
  label?: string;
}) {
  return (
    <ul aria-label={label} className="-ml-2 flex flex-wrap items-center gap-1">
      {series.map((item) => {
        const off = state.isHidden(item.key);

        return (
          <li key={item.key}>
            <button
              type="button"
              aria-pressed={!off}
              title={`${off ? "Mostrar" : "Ocultar"} ${item.label}`}
              onClick={() => state.toggle(item.key)}
              onPointerEnter={() => state.focus(item.key)}
              onPointerLeave={() => state.focus(null)}
              onFocus={() => state.focus(item.key)}
              onBlur={() => state.focus(null)}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
                "hover:bg-accent focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
                off
                  ? "text-subtle-foreground"
                  : "text-muted-foreground hover:text-foreground",
                state.focused === item.key && !off && "bg-accent text-foreground",
              )}
            >
              <LegendMark
                color={item.color}
                shape={item.shape ?? "rect"}
                off={off}
              />
              <span className={cn(off && "line-through")}>{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function LegendMark({
  color,
  shape,
  off,
}: {
  color: string;
  shape: "rect" | "line";
  off: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "shrink-0 transition-opacity",
        shape === "line" ? "h-0.5 w-3 rounded-full" : "size-2 rounded-[2px]",
        off && "opacity-30",
      )}
      style={{ backgroundColor: color }}
    />
  );
}
