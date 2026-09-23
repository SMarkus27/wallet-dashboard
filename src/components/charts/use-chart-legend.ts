"use client";

import { useCallback, useState } from "react";

const DIMMED_OPACITY = 0.28;

export type ChartLegendState = {
  hidden: ReadonlySet<string>;
  focused: string | null;
  toggle: (key: string) => void;
  focus: (key: string | null) => void;
  isHidden: (key: string) => boolean;
  isVisible: (key: string) => boolean;
  opacityOf: (key: string) => number;
};

export function useChartLegend(keys: readonly string[]): ChartLegendState {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const [focused, setFocused] = useState<string | null>(null);

  const toggle = useCallback(
    (key: string) => {
      setHidden((current) => {
        const next = new Set(current);
        if (!next.delete(key)) next.add(key);
        return next.size < keys.length ? next : current;
      });
    },
    [keys],
  );

  const isHidden = (key: string) => hidden.has(key);

  return {
    hidden,
    focused,
    toggle,
    focus: setFocused,
    isHidden,
    isVisible: (key) => !isHidden(key),
    opacityOf: (key) =>
      focused === null || focused === key ? 1 : DIMMED_OPACITY,
  };
}
