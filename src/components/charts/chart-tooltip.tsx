import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type TooltipRow = {
  key: string;
  label: string;
  value: string;
  color?: string;
  muted?: boolean;
};

export function ChartTooltip({
  title,
  rows,
  footer,
  className,
}: {
  title: string;
  rows: TooltipRow[];
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-44 rounded-lg border border-border bg-popover px-3 py-2 shadow-md",
        className,
      )}
    >
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{title}</p>

      <dl className="flex flex-col gap-1">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="h-0.5 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: row.color ?? "transparent" }}
            />
            <dt
              className={cn(
                "flex-1",
                row.muted ? "text-subtle-foreground" : "text-muted-foreground",
              )}
            >
              {row.label}
            </dt>
            <dd className="font-medium text-foreground tabular-nums">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {footer ? (
        <div className="mt-1.5 border-t border-border pt-1.5 text-xs">{footer}</div>
      ) : null}
    </div>
  );
}
