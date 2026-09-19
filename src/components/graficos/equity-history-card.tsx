"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";

import { EquityChart } from "@/components/charts/equity-chart";
import { FilterRow } from "@/components/filters/filter-row";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api/client";
import {
  PORTFOLIO_PERIODS,
  PORTFOLIO_PERIOD_LABELS,
  assetTypeQueryValue,
  type PortfolioAllocation,
  type PortfolioEquityHistory,
  type PortfolioPeriod,
} from "@/lib/api/types";
import { formatCurrency, toNumber } from "@/lib/format";
import { ALL_TYPES, assetTypeOptions } from "@/lib/portfolio/shares";
import { cn } from "@/lib/utils";

const DEFAULT_PERIOD: PortfolioPeriod = "ALL";

export function EquityHistoryCard({
  allocation,
  initialHistory,
}: {
  allocation: PortfolioAllocation;
  initialHistory: PortfolioEquityHistory;
}) {
  const [period, setPeriod] = useState<PortfolioPeriod>(DEFAULT_PERIOD);
  const [assetType, setAssetType] = useState(ALL_TYPES);

  const isDefault = period === DEFAULT_PERIOD && assetType === ALL_TYPES;

  const { data, isFetching } = useQuery({
    queryKey: ["equity-history", period, assetType],
    queryFn: () =>
      api.get<PortfolioEquityHistory>("/investor/portfolio/equity/history", {
        period,
        asset_type:
          assetType === ALL_TYPES ? undefined : assetTypeQueryValue(assetType),
      }),
    initialData: isDefault ? initialHistory : undefined,
  });

  const months = data?.months ?? [];
  const last = months.at(-1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Evolução do patrimônio
          {isFetching ? (
            <LoaderCircleIcon
              className="size-3.5 animate-spin text-muted-foreground"
              aria-label="Carregando"
            />
          ) : null}
        </CardTitle>
        <CardDescription>
          A distância entre as duas linhas é o ganho de capital não realizado.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <FilterRow
          fields={[
            {
              id: "period",
              label: "Período",
              value: period,
              onChange: (value) => setPeriod(value as PortfolioPeriod),
              options: PORTFOLIO_PERIODS.map((value) => ({
                value,
                label: PORTFOLIO_PERIOD_LABELS[value],
              })),
            },
            {
              id: "equity-asset-type",
              label: "Tipo de ativo",
              value: assetType,
              onChange: setAssetType,
              options: assetTypeOptions(allocation),
            },
          ]}
        />

        <div className={cn(isFetching && "opacity-60 transition-opacity")}>
          {months.length > 0 ? (
            <EquityChart months={months} />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sem histórico para o recorte selecionado.
            </p>
          )}
        </div>

        {last ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4 sm:grid-cols-3">
            <Stat
              label="Valor aplicado"
              value={formatCurrency(last.invested_amount)}
            />
            <Stat
              label="Ganho de capital"
              value={formatCurrency(last.capital_gain)}
              tone={toneOf(toNumber(last.capital_gain))}
            />
            <Stat label="Patrimônio" value={formatCurrency(last.total_equity)} />
          </dl>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-lg font-semibold tracking-tight", tone)}>{value}</dd>
    </div>
  );
}

function toneOf(value: number) {
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return undefined;
}
