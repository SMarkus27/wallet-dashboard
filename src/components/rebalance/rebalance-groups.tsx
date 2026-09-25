import { RebalanceShare } from "@/components/rebalance/rebalance-summary";
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
import { formatCurrency, formatPercent } from "@/lib/format";
import { distanceToTarget, toGroupRows } from "@/lib/portfolio/rebalance";
import type { RebalanceGroup } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function RebalanceGroups({
  title,
  description,
  groups,
}: {
  title: string;
  description: string;
  groups: RebalanceGroup[];
}) {
  const rows = toGroupRows(groups);

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Meta</TableHead>
              <TableHead className="text-right">Atual → projetado</TableHead>
              <TableHead className="text-right">Recebe</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatPercent(row.target)}
                </TableCell>
                <TableCell className="text-right">
                  <RebalanceShare current={row.current} projected={row.projected} />
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    row.amount > 0 ? "font-medium" : "text-subtle-foreground",
                  )}
                >
                  {formatCurrency(row.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {rows.every((row) => distanceToTarget(row) >= 0) ? (
          <p className="pt-3 text-xs text-subtle-foreground">
            Com este aporte nenhum grupo se aproxima da meta: todos já estão no
            alvo ou acima dele.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
