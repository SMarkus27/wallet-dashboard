"use client";

import { useQuery } from "@tanstack/react-query";

import { DarfAction } from "@/components/irpf/darf-action";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api/client";
import { assetTypeLabel, type TaxPeriodDetail } from "@/lib/api/types";
import { formatCurrency, formatIsoDate, formatQuantity } from "@/lib/format";
import {
  TAX_STATUS_LABELS,
  TAX_STATUS_VARIANTS,
  type TaxMonth,
} from "@/lib/portfolio/taxes";

export function PeriodDetail({
  month,
  onError,
}: {
  month: TaxMonth;
  onError: (message: string | null) => void;
}) {
  const { data, isPending } = useQuery({
    queryKey: ["tax-period", month.year, month.month],
    queryFn: () =>
      api.get<TaxPeriodDetail>(
        `/investor/taxes/periods/${month.year}/${month.month}`,
      ),
  });

  return (
    <div className="flex flex-col gap-6 bg-muted/40 px-4 py-5">
      <section className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold tracking-tight text-muted-foreground">
          Apuração por classe
        </h4>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Classe</TableHead>
              <TableHead className="text-right">Base tributável</TableHead>
              <TableHead className="text-right">IRRF retido</TableHead>
              <TableHead className="text-right">Imposto devido</TableHead>
              <TableHead className="text-right">DARF</TableHead>
              <TableHead className="text-right">Situação</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {month.periods.map((period) => (
              <TableRow key={period.external_id_str}>
                <TableCell className="font-medium">
                  {assetTypeLabel(period.asset_type)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(period.taxable_amount)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(period.total_withholding_tax)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(period.total_tax_due)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(period.darf_amount)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={TAX_STATUS_VARIANTS[period.status]}>
                    {TAX_STATUS_LABELS[period.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DarfAction period={period} onError={onError} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {isPending ? (
        <Skeleton className="h-28 rounded-lg" />
      ) : (
        <>
          <Operations operations={data?.operations ?? []} />
          <LossBalance balance={data?.loss_balance ?? {}} />
        </>
      )}
    </div>
  );
}

function Operations({
  operations,
}: {
  operations: TaxPeriodDetail["operations"];
}) {
  if (operations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma operação tributável neste mês.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold tracking-tight text-muted-foreground">
        Operações do mês
      </h4>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Data</TableHead>
            <TableHead>Ticker</TableHead>
            <TableHead>Operação</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="text-right">Resultado</TableHead>
            <TableHead className="text-right">IRRF</TableHead>
            <TableHead className="text-right">Imposto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {operations.map((operation) => (
            <TableRow key={operation.external_id_str}>
              <TableCell className="whitespace-nowrap">
                {formatIsoDate(operation.traded_at)}
              </TableCell>
              <TableCell className="font-medium">{operation.ticker}</TableCell>
              <TableCell>{operation.transaction_type}</TableCell>
              <TableCell className="text-right">
                {formatQuantity(operation.quantity)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(operation.price)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(operation.taxable_profit_loss)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(operation.withholding_tax)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(operation.tax_due)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

function LossBalance({ balance }: { balance: TaxPeriodDetail["loss_balance"] }) {
  const entries = Object.entries(balance);

  if (entries.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold tracking-tight text-muted-foreground">
        Prejuízo a compensar depois deste mês
      </h4>

      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        {entries.map(([name, amount]) => (
          <div key={name} className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">{assetTypeLabel(name)}</dt>
            <dd className="font-medium tabular-nums">{formatCurrency(amount)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
