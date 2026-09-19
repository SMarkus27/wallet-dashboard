"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDownIcon, TriangleAlertIcon } from "lucide-react";

import { FilterRow } from "@/components/filters/filter-row";
import { PeriodDetail } from "@/components/irpf/period-detail";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TaxPeriodList } from "@/lib/api/types";
import { formatCurrency, formatMonthLong } from "@/lib/format";
import {
  ANY_TYPE,
  ANY_YEAR,
  MIN_DARF_AMOUNT,
  TAX_STATUS_LABELS,
  type TaxMonth,
  applyFilters,
  assetTypesOf,
  groupByMonth,
  isUncollectible,
  yearsOf,
} from "@/lib/portfolio/taxes";
import { cn } from "@/lib/utils";

const COLUMNS = 8;

export function IrpfView({ taxes }: { taxes: TaxPeriodList }) {
  const [year, setYear] = useState(ANY_YEAR);
  const [assetType, setAssetType] = useState(ANY_TYPE);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const months = useMemo(
    () => groupByMonth(applyFilters(taxes.periods, { year, assetType })),
    [taxes.periods, year, assetType],
  );

  const pendingTotal = months.reduce(
    (total, month) => total + month.pendingDarf,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Apuração mensal</CardTitle>
          <CardDescription>
            A DARF do mês consolida as classes; o prejuízo, não — ele é compensado
            dentro da própria classe.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <FilterRow
            fields={[
              {
                id: "tax-year",
                label: "Ano",
                value: year,
                onChange: setYear,
                options: [
                  { value: ANY_YEAR, label: "Todos os anos" },
                  ...yearsOf(taxes.periods).map((item) => ({
                    value: String(item),
                    label: String(item),
                  })),
                ],
              },
              {
                id: "tax-asset-type",
                label: "Tipo de ativo",
                value: assetType,
                onChange: setAssetType,
                options: [
                  { value: ANY_TYPE, label: "Todas as classes" },
                  ...assetTypesOf(taxes.periods),
                ],
              },
            ]}
          />

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4 sm:grid-cols-3">
            <Stat
              label="DARF no recorte"
              value={formatCurrency(
                months.reduce((total, month) => total + month.darfAmount, 0),
              )}
            />
            <Stat label="DARF pendente" value={formatCurrency(pendingTotal)} />
            <Stat label="Meses apurados" value={String(months.length)} />
          </dl>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Impostos e DARF</CardTitle>
          <CardDescription>
            Abra um mês para ver a apuração por classe, as operações e o prejuízo a
            compensar.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2">
          {months.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum período apurado para os filtros selecionados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Prejuízo</TableHead>
                  <TableHead className="text-right">Compensação</TableHead>
                  <TableHead className="text-right">Base tributável</TableHead>
                  <TableHead className="text-right">IRRF retido</TableHead>
                  <TableHead className="text-right">DARF</TableHead>
                  <TableHead className="text-right">Situação</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {months.map((month) => {
                  const open = expanded === month.reference;

                  return (
                    <Fragment key={month.reference}>
                      <TableRow
                        role="button"
                        tabIndex={0}
                        aria-expanded={open}
                        onClick={() =>
                          setExpanded(open ? null : month.reference)
                        }
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          setExpanded(open ? null : month.reference);
                        }}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <ChevronDownIcon
                              aria-hidden
                              className={cn(
                                "size-3.5 text-muted-foreground transition-transform",
                                open && "rotate-180",
                              )}
                            />
                            <span className="first-letter:uppercase">
                              {formatMonthLong(month.reference)}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(month.totalProfit)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(month.totalLoss)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(month.lossCompensation)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(month.taxableAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(month.withholdingTax)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(month.darfAmount)}
                          {isUncollectible(month.darfAmount) ? (
                            <span className="block text-xs font-normal text-muted-foreground">
                              abaixo de {formatCurrency(MIN_DARF_AMOUNT)}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">
                          <MonthStatus month={month} />
                        </TableCell>
                      </TableRow>

                      {open ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={COLUMNS} className="p-0">
                            <PeriodDetail month={month} onError={setError} />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MonthStatus({ month }: { month: TaxMonth }) {
  if (month.darfAmount === 0) {
    // Isenção e ausência de imposto zeram a DARF do mesmo jeito, mas dizem
    // coisas diferentes: uma é venda abaixo do limite mensal, a outra é não
    // ter havido resultado a tributar.
    const shared = month.sharedStatus;

    return (
      <Badge variant="outline">
        {shared && shared !== "PENDENTE" && shared !== "PAGO"
          ? TAX_STATUS_LABELS[shared]
          : "Sem DARF"}
      </Badge>
    );
  }

  if (!month.isPayable) return <Badge variant="outline">Não recolhida</Badge>;

  return month.hasPending ? (
    <Badge variant="warning">Pendente</Badge>
  ) : (
    <Badge variant="positive">Paga</Badge>
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
