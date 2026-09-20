"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { SURFACE, seriesColor } from "@/components/charts/chart-tokens";
import { formatCurrency, formatPercent, toNumber } from "@/lib/format";

const MAX_SLICES = 6;

const OTHER_KEY = "other";

const OTHER_LABEL = "Outros";

export type ShareDatum = {
  key: string;
  label: string;
  caption?: string | null;
  percentage: number;
  idealPercentage?: number | null;
  value: number;
};

type Painted = ShareDatum & { color: string };

export function ShareDonut({
  data,
  measure = "Participação",
  emptyMessage = "Sem posições para exibir.",
}: {
  data: ShareDatum[];
  measure?: string;
  emptyMessage?: string;
}) {
  const ordered = useMemo(() => sorted(data), [data]);
  const painted = useMemo(() => paint(ordered), [ordered]);

  if (ordered.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <ResponsiveContainer width="100%" height={208} className="max-w-56">
        <PieChart>
          <Pie
            data={painted}
            dataKey="percentage"
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

          <Tooltip content={<SliceTooltip measure={measure} />} />
        </PieChart>
      </ResponsiveContainer>

      <SliceTable rows={ordered} colors={colorIndex(painted)} measure={measure} />
    </div>
  );
}

function SliceTable({
  rows,
  colors,
  measure,
}: {
  rows: ShareDatum[];
  colors: Map<string, string>;
  measure: string;
}) {
  const withIdeal = rows.some(
    (row) => row.idealPercentage !== null && row.idealPercentage !== undefined,
  );

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{measure} de cada fatia</caption>
      <thead>
        <tr className="text-xs text-muted-foreground">
          <th scope="col" className="pb-1 text-left font-medium">
            Fatia
          </th>
          <th scope="col" className="pb-1 text-right font-medium">
            Real
          </th>
          {withIdeal ? (
            <th scope="col" className="pb-1 text-right font-medium">
              Ideal
            </th>
          ) : null}
          <th scope="col" className="pb-1 text-right font-medium">
            Saldo
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-t border-border">
            <th scope="row" className="py-1.5 text-left font-normal">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: colorOf(colors, row.key) }}
                />
                <span>
                  {row.label}
                  {row.caption ? (
                    <span className="block text-xs text-muted-foreground">
                      {row.caption}
                    </span>
                  ) : null}
                </span>
              </span>
            </th>
            <td className="py-1.5 text-right font-medium">
              {formatPercent(row.percentage)}
            </td>
            {withIdeal ? (
              <td className="py-1.5 text-right text-muted-foreground">
                {row.idealPercentage === null || row.idealPercentage === undefined
                  ? "—"
                  : formatPercent(row.idealPercentage)}
              </td>
            ) : null}
            <td className="py-1.5 text-right">{formatCurrency(row.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SliceTooltip({
  active,
  payload,
  measure,
}: {
  active?: boolean;
  payload?: { payload: Painted }[];
  measure: string;
}) {
  const slice = payload?.[0]?.payload;

  if (!active || !slice) return null;

  return (
    <ChartTooltip
      title={slice.label}
      rows={[
        ...(slice.caption
          ? [
              {
                key: "caption",
                label: "Classe",
                value: slice.caption,
                muted: true,
              },
            ]
          : []),
        {
          key: "real",
          label: measure,
          value: formatPercent(slice.percentage),
          color: slice.color,
        },
        ...(slice.idealPercentage === null || slice.idealPercentage === undefined
          ? []
          : [
              {
                key: "ideal",
                label: "Meta",
                value: formatPercent(slice.idealPercentage),
                muted: true,
              },
            ]),
        { key: "value", label: "Saldo", value: formatCurrency(slice.value) },
      ]}
    />
  );
}

function sorted(data: ShareDatum[]) {
  return data
    .filter((item) => toNumber(item.value) > 0)
    .sort((left, right) => right.percentage - left.percentage);
}

// A pizza dobra a cauda para não virar confete — acima de seis fatias as cores
// deixam de ser distinguíveis. A tabela ao lado continua listando todas, então
// dobrar esconde a fatia no desenho, nunca o número.
function paint(ordered: ShareDatum[]): Painted[] {
  const head = ordered.slice(0, MAX_SLICES - 1);
  const tail = ordered.slice(MAX_SLICES - 1);

  const slices =
    ordered.length <= MAX_SLICES
      ? ordered
      : [
          ...head,
          {
            key: OTHER_KEY,
            label: `${OTHER_LABEL} (${tail.length})`,
            percentage: sum(tail, (item) => item.percentage),
            value: sum(tail, (item) => item.value),
          },
        ];

  return slices.map((slice, index) => ({
    ...slice,
    color: seriesColor(index),
  }));
}

// Linha dobrada herda a cor do arco "Outros": é nele que ela está desenhada, e
// um quadradinho cinza sem explicação pareceria falha de renderização.
function colorOf(colors: Map<string, string>, key: string) {
  return (
    colors.get(key) ?? colors.get(OTHER_KEY) ?? "var(--color-subtle-foreground)"
  );
}

function colorIndex(painted: Painted[]) {
  return new Map(painted.map((slice) => [slice.key, slice.color]));
}

function sum<T>(items: T[], pick: (item: T) => number) {
  return items.reduce((total, item) => total + pick(item), 0);
}
