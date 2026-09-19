"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { SURFACE, seriesColor } from "@/components/charts/chart-tokens";
import { formatCurrency, formatPercent, toNumber } from "@/lib/format";

const MAX_SLICES = 6;

const OTHER_LABEL = "Outros";

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  realPercentage: number;
  idealPercentage: number | null;
};

type Painted = DonutSlice & { color: string };

export function AllocationDonut({
  slices,
  emptyMessage = "Sem posições para exibir.",
}: {
  slices: DonutSlice[];
  emptyMessage?: string;
}) {
  const painted = useMemo(() => paint(slices), [slices]);

  if (painted.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <ResponsiveContainer width="100%" height={200} className="max-w-56">
        <PieChart>
          <Pie
            data={painted}
            dataKey="value"
            nameKey="label"
            innerRadius="58%"
            outerRadius="92%"
            paddingAngle={2}
            stroke={SURFACE}
            strokeWidth={2}
            isAnimationActive={false}
          >
            {painted.map((slice) => (
              <Cell key={slice.key} fill={slice.color} />
            ))}
          </Pie>

          <Tooltip content={<SliceTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <SliceTable slices={painted} />
    </div>
  );
}

function SliceTable({ slices }: { slices: Painted[] }) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">
        Participação de cada tipo de ativo na carteira
      </caption>
      <thead>
        <tr className="text-xs text-muted-foreground">
          <th scope="col" className="pb-1 text-left font-medium">
            Tipo
          </th>
          <th scope="col" className="pb-1 text-right font-medium">
            Real
          </th>
          <th scope="col" className="pb-1 text-right font-medium">
            Ideal
          </th>
          <th scope="col" className="pb-1 text-right font-medium">
            Saldo
          </th>
        </tr>
      </thead>
      <tbody>
        {slices.map((slice) => (
          <tr key={slice.key} className="border-t border-border">
            <th scope="row" className="py-1.5 text-left font-normal">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.label}
              </span>
            </th>
            <td className="py-1.5 text-right font-medium">
              {formatPercent(slice.realPercentage)}
            </td>
            <td className="py-1.5 text-right text-muted-foreground">
              {slice.idealPercentage === null
                ? "—"
                : formatPercent(slice.idealPercentage)}
            </td>
            <td className="py-1.5 text-right">{formatCurrency(slice.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SliceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Painted }[];
}) {
  const slice = payload?.[0]?.payload;

  if (!active || !slice) return null;

  return (
    <ChartTooltip
      title={slice.label}
      rows={[
        {
          key: "real",
          label: "Participação real",
          value: formatPercent(slice.realPercentage),
          color: slice.color,
        },
        {
          key: "ideal",
          label: "Participação ideal",
          value:
            slice.idealPercentage === null
              ? "—"
              : formatPercent(slice.idealPercentage),
          muted: true,
        },
        { key: "value", label: "Saldo", value: formatCurrency(slice.value) },
      ]}
    />
  );
}

function paint(slices: DonutSlice[]): Painted[] {
  const positive = slices
    .filter((slice) => toNumber(slice.value) > 0)
    .sort((left, right) => right.value - left.value);

  return fold(positive).map((slice, index) => ({
    ...slice,
    color: seriesColor(index),
  }));
}

function fold(slices: DonutSlice[]): DonutSlice[] {
  if (slices.length <= MAX_SLICES) return slices;

  const head = slices.slice(0, MAX_SLICES - 1);
  const tail = slices.slice(MAX_SLICES - 1);

  return [
    ...head,
    {
      key: "other",
      label: OTHER_LABEL,
      value: sum(tail, (slice) => slice.value),
      realPercentage: sum(tail, (slice) => slice.realPercentage),
      idealPercentage: sum(tail, (slice) => slice.idealPercentage ?? 0),
    },
  ];
}

function sum<T>(items: T[], pick: (item: T) => number) {
  return items.reduce((total, item) => total + pick(item), 0);
}
