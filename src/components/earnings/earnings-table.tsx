import { Fragment } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatIsoDate,
  formatMonthLong,
  formatQuantity,
} from "@/lib/format";
import { EARNING_KIND_LABELS, type MonthGroup } from "@/lib/portfolio/earnings";

const COLUMNS = 7;

export function EarningsTable({ groups }: { groups: MonthGroup[] }) {
  if (groups.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhum provento para os filtros selecionados.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Data</TableHead>
          <TableHead>Ticker</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Quantidade</TableHead>
          <TableHead className="text-right">Valor por cota</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="text-right">Situação</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {groups.map((group) => (
          <Fragment key={group.reference}>
            <TableRow className="hover:bg-transparent">
              <th
                scope="colgroup"
                colSpan={COLUMNS}
                className="bg-muted/60 px-3 py-2 text-left"
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="text-sm font-semibold tracking-tight first-letter:uppercase">
                    {formatMonthLong(group.reference)}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(group.total)}
                  </span>
                </span>
              </th>
            </TableRow>

            {group.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">
                  {formatIsoDate(row.date)}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{row.ticker}</span>
                  <span className="block text-xs text-muted-foreground">
                    {row.assetTypeLabel}
                  </span>
                </TableCell>
                <TableCell>{EARNING_KIND_LABELS[row.kind]}</TableCell>
                <TableCell className="text-right">
                  {formatQuantity(row.quantity)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(row.price)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(row.amount)}
                </TableCell>
                <TableCell className="text-right">
                  {row.status === "RECEIVED" ? (
                    <Badge variant="positive">Recebido</Badge>
                  ) : (
                    <Badge variant="outline">Previsto</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
