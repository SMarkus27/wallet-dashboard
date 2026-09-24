"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import {
  SERIES_LIMIT,
  SURFACE,
  seriesColor,
} from "@/components/charts/chart-tokens";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent, toNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_SLICES = SERIES_LIMIT;

const DENSE_SLICES = 12;

const OTHER_KEY = "other";

const OTHER_LABEL = "Outros";

const CHART_HEIGHT = 208;

const DENSE_CHART_HEIGHT = 272;

const BASE_RADIUS = "90%";

const ACTIVE_RADIUS = "98%";

const INNER_RADIUS = "58%";

const DIMMED_OPACITY = 0.3;

const RING_GAP = 2;

const DENSE_RING_GAP = 0.5;

const RING_STROKE = 2;

const DENSE_RING_STROKE = 1;

const ANIMATION_DURATION = 350;

export type ShareDatum = {
  key: string;
  label: string;
  caption?: string | null;
  percentage: number;
  idealPercentage?: number | null;
  value: number;
};

type Painted = {
  id: string;
  label: string;
  caption?: string | null;
  percentage: number;
  idealPercentage?: number | null;
  value: number;
  color: string;
};

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

  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const active = hovered ?? selected;
  const activeSlice = painted.find((slice) => slice.id === active) ?? null;

  const total = ordered.reduce((sum, row) => sum + row.value, 0);

  if (ordered.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const dense = painted.length > DENSE_SLICES;

  const paintedIdOf = (key: string) =>
    painted.some((slice) => slice.id === key) ? key : OTHER_KEY;

  const select = (id: string | null) =>
    setSelected((current) => (current === id ? null : id));

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <div
        className={cn(
          "flex w-full shrink-0 flex-col items-center gap-1",
          dense ? "max-w-72" : "max-w-56",
        )}
      >
        <div className="relative w-full">
          <ResponsiveContainer
            width="100%"
            height={dense ? DENSE_CHART_HEIGHT : CHART_HEIGHT}
          >
            <PieChart>
              <Pie
                data={painted}
                dataKey="value"
                nameKey="label"
                innerRadius={INNER_RADIUS}
                outerRadius={(slice: Painted) =>
                  slice.id === active ? ACTIVE_RADIUS : BASE_RADIUS
                }
                paddingAngle={dense ? DENSE_RING_GAP : RING_GAP}
                stroke={SURFACE}
                strokeWidth={dense ? DENSE_RING_STROKE : RING_STROKE}
                className="cursor-pointer"
                animationDuration={ANIMATION_DURATION}
                onMouseEnter={(_, index) =>
                  setHovered(painted[index]?.id ?? null)
                }
                onMouseLeave={() => setHovered(null)}
                onClick={(_, index) => select(painted[index]?.id ?? null)}
              >
                {painted.map((slice) => (
                  <Cell
                    key={slice.id}
                    fill={slice.color}
                    fillOpacity={
                      active === null || active === slice.id ? 1 : DIMMED_OPACITY
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <DonutCenter
            slice={activeSlice}
            total={total}
            sliceCount={ordered.length}
          />
        </div>

        <div className="flex h-7 items-center">
          {selected ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelected(null)}
              className="h-7 px-2.5 text-xs"
            >
              Limpar destaque
            </Button>
          ) : null}
        </div>
      </div>

      <SliceTable
        rows={ordered}
        colors={colorIndex(painted)}
        group={painted.find((slice) => slice.id === OTHER_KEY) ?? null}
        measure={measure}
        active={active}
        selected={selected}
        onHover={(key) => setHovered(key === null ? null : paintedIdOf(key))}
        onSelect={(key) => select(paintedIdOf(key))}
      />
    </div>
  );
}

function DonutCenter({
  slice,
  total,
  sliceCount,
}: {
  slice: Painted | null;
  total: number;
  sliceCount: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-10 text-center"
    >
      {slice ? (
        <>
          <p className="max-w-full truncate text-xs text-muted-foreground">
            {slice.label}
          </p>
          <p className="text-lg font-semibold tracking-tight">
            {formatPercent(slice.percentage)}
          </p>
          <p className="text-xs text-subtle-foreground">
            {formatCurrency(slice.value)}
          </p>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-semibold tracking-tight">
            {formatCurrency(total)}
          </p>
          <p className="text-xs text-subtle-foreground">
            {sliceCount} {sliceCount === 1 ? "fatia" : "fatias"}
          </p>
        </>
      )}
    </div>
  );
}

function SliceTable({
  rows,
  colors,
  group,
  measure,
  active,
  selected,
  onHover,
  onSelect,
}: {
  rows: ShareDatum[];
  colors: Map<string, string>;
  group: Painted | null;
  measure: string;
  active: string | null;
  selected: string | null;
  onHover: (key: string | null) => void;
  onSelect: (key: string) => void;
}) {
  const painted = rows.filter((row) => colors.has(row.key));
  const members = rows.filter((row) => !colors.has(row.key));

  const withIdeal = rows.some(
    (row) => row.idealPercentage !== null && row.idealPercentage !== undefined,
  );

  const rowFor = (
    row: ShareDatum,
    options: { color?: string; nested?: boolean } = {},
  ) => (
    <SliceRow
      key={row.key}
      id={row.key}
      label={row.label}
      caption={row.caption}
      percentage={row.percentage}
      idealPercentage={row.idealPercentage}
      value={row.value}
      color={options.color}
      nested={options.nested}
      withIdeal={withIdeal}
      highlighted={highlights(active, row.key, colors)}
      pressed={highlights(selected, row.key, colors)}
      onHover={onHover}
      onSelect={onSelect}
    />
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
        {painted.map((row) => rowFor(row, { color: colors.get(row.key) }))}

        {group ? (
          <SliceRow
            id={group.id}
            label={group.label}
            percentage={group.percentage}
            idealPercentage={sum(members, (row) => row.idealPercentage ?? 0)}
            value={group.value}
            color={group.color}
            withIdeal={withIdeal}
            highlighted={highlights(active, group.id, colors)}
            pressed={highlights(selected, group.id, colors)}
            onHover={onHover}
            onSelect={onSelect}
          />
        ) : null}

        {members.map((row) => rowFor(row, { nested: true }))}
      </tbody>
    </table>
  );
}

function SliceRow({
  id,
  label,
  caption,
  percentage,
  idealPercentage,
  value,
  color,
  nested,
  withIdeal,
  highlighted,
  pressed,
  onHover,
  onSelect,
}: {
  id: string;
  label: string;
  caption?: string | null;
  percentage: number;
  idealPercentage?: number | null;
  value: number;
  color?: string;
  nested?: boolean;
  withIdeal: boolean;
  highlighted: boolean;
  pressed: boolean;
  onHover: (key: string | null) => void;
  onSelect: (key: string) => void;
}) {
  return (
    <tr
      onPointerEnter={() => onHover(id)}
      onPointerLeave={() => onHover(null)}
      className={cn(
        "border-t border-border transition-colors",
        highlighted && "bg-accent",
      )}
    >
      <th
        scope="row"
        className={cn(
          "py-1.5 text-left font-normal",
          nested && "pl-4 text-muted-foreground",
        )}
      >
        <button
          type="button"
          aria-pressed={pressed}
          title={
            nested
              ? `${label} está dentro de ${OTHER_LABEL} no gráfico`
              : `Destacar ${label} no gráfico`
          }
          onClick={() => onSelect(id)}
          onFocus={() => onHover(id)}
          onBlur={() => onHover(null)}
          className="flex cursor-pointer items-center gap-2 rounded-md text-left focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
        >
          {color ? (
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: color }}
            />
          ) : (
            <span
              aria-hidden
              className="h-0.5 w-2 shrink-0 rounded-full bg-subtle-foreground"
            />
          )}
          <span>
            {label}
            {caption ? (
              <span className="block text-xs text-muted-foreground">
                {caption}
              </span>
            ) : null}
          </span>
        </button>
      </th>
      <td className="py-1.5 text-right font-medium">
        {formatPercent(percentage)}
      </td>
      {withIdeal ? (
        <td className="py-1.5 text-right text-muted-foreground">
          {idealPercentage === null || idealPercentage === undefined
            ? "—"
            : formatPercent(idealPercentage)}
        </td>
      ) : null}
      <td className="py-1.5 text-right">{formatCurrency(value)}</td>
    </tr>
  );
}

function highlights(
  highlighted: string | null,
  key: string,
  colors: Map<string, string>,
) {
  if (highlighted === null) return false;
  if (highlighted === key) return true;
  return highlighted === OTHER_KEY && !colors.has(key);
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

  const folded: ShareDatum = {
    key: OTHER_KEY,
    label: `${OTHER_LABEL} (${tail.length})`,
    caption: null,
    percentage: sum(tail, (item) => item.percentage),
    idealPercentage: null,
    value: sum(tail, (item) => item.value),
  };

  const slices = ordered.length <= MAX_SLICES ? ordered : [...head, folded];

  return slices.map((slice, index) => ({
    id: slice.key,
    label: slice.label,
    caption: slice.caption ?? null,
    percentage: slice.percentage,
    idealPercentage: slice.idealPercentage ?? null,
    value: slice.value,
    color: seriesColor(index),
  }));
}

function colorIndex(painted: Painted[]) {
  return new Map(painted.map((slice) => [slice.id, slice.color]));
}

function sum<T>(items: T[], pick: (item: T) => number) {
  return items.reduce((total, item) => total + pick(item), 0);
}
