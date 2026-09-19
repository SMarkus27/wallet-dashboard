"use client";

import { useMemo, useState } from "react";

import { EarningsChart } from "@/components/charts/earnings-chart";
import { FilterRow } from "@/components/filters/filter-row";
import { EarningsTable } from "@/components/earnings/earnings-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  PortfolioEarnings,
  PortfolioScheduledEarnings,
} from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import {
  ANY,
  EARNING_STATUSES,
  EARNING_STATUS_LABELS,
  GRANULARITIES,
  GRANULARITY_LABELS,
  type EarningStatus,
  type Granularity,
  applyFilters,
  assetTypesOf,
  groupByMonth,
  tickersOf,
  toRows,
  toSeries,
  totalOf,
} from "@/lib/portfolio/earnings";
import { cn } from "@/lib/utils";

export function EarningsView({
  received,
  scheduled,
}: {
  received: PortfolioEarnings;
  scheduled: PortfolioScheduledEarnings;
}) {
  const rows = useMemo(() => toRows(received, scheduled), [received, scheduled]);

  const [status, setStatus] = useState<EarningStatus>(ANY);
  const [ticker, setTicker] = useState(ANY);
  const [assetType, setAssetType] = useState(ANY);
  const [granularity, setGranularity] = useState<Granularity>("MONTH");

  const byAsset = useMemo(
    () => applyFilters(rows, { status: ANY, ticker, assetType }),
    [rows, ticker, assetType],
  );

  const tableRows = useMemo(
    () => applyFilters(byAsset, { status, ticker: ANY, assetType: ANY }),
    [byAsset, status],
  );

  const chartPoints = useMemo(
    () => toSeries(byAsset.filter((row) => row.status === "RECEIVED"), granularity),
    [byAsset, granularity],
  );

  const receivedTotal = totalOf(byAsset.filter((row) => row.status === "RECEIVED"));
  const scheduledTotal = totalOf(byAsset.filter((row) => row.status === "SCHEDULED"));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Ticker e tipo de ativo valem para a tabela e para o gráfico. A situação
            vale só para a tabela — o gráfico é sempre de proventos recebidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <FilterRow
            fields={[
              {
                id: "status",
                label: "Situação",
                value: status,
                onChange: (value) => setStatus(value as EarningStatus),
                options: EARNING_STATUSES.map((value) => ({
                  value,
                  label: EARNING_STATUS_LABELS[value],
                })),
              },
              {
                id: "ticker",
                label: "Ticker",
                value: ticker,
                onChange: setTicker,
                options: [
                  { value: ANY, label: "Todos os ativos" },
                  ...tickersOf(rows).map((item) => ({ value: item, label: item })),
                ],
              },
              {
                id: "asset-type",
                label: "Tipo de ativo",
                value: assetType,
                onChange: setAssetType,
                options: [
                  { value: ANY, label: "Todas as classes" },
                  ...assetTypesOf(rows),
                ],
              },
            ]}
          />

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4 sm:grid-cols-3">
            <Stat label="Recebido" value={formatCurrency(receivedTotal)} />
            <Stat label="Previsto" value={formatCurrency(scheduledTotal)} />
            <Stat
              label="Recebido em 12 meses"
              value={formatCurrency(received.last_12_months)}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Evolução dos proventos recebidos</CardTitle>
            <CardDescription>
              Dividendos e JCP empilhados, no valor líquido que entrou na conta.
            </CardDescription>
          </div>
          <GranularityToggle value={granularity} onChange={setGranularity} />
        </CardHeader>
        <CardContent>
          {chartPoints.length > 0 ? (
            <EarningsChart points={chartPoints} granularity={granularity} />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum provento recebido para os filtros selecionados.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico mensal</CardTitle>
          <CardDescription>
            {tableRows.length} pagamento{tableRows.length === 1 ? "" : "s"} ·{" "}
            {formatCurrency(totalOf(tableRows))}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2">
          <EarningsTable groups={groupByMonth(tableRows)} />
        </CardContent>
      </Card>
    </div>
  );
}

function GranularityToggle({
  value,
  onChange,
}: {
  value: Granularity;
  onChange: (value: Granularity) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Agrupamento do gráfico"
      className="flex shrink-0 gap-1 rounded-md border border-border p-0.5"
    >
      {GRANULARITIES.map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant="ghost"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "h-7 px-3",
            value === option && "bg-secondary text-secondary-foreground",
          )}
        >
          {GRANULARITY_LABELS[option]}
        </Button>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tracking-tight">{value}</dd>
    </div>
  );
}
