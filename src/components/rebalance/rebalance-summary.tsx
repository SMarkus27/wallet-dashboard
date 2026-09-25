import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PortfolioRebalance } from "@/lib/api/types";
import { formatCurrency, formatPercent, toNumber } from "@/lib/format";

export function RebalanceSummary({ data }: { data: PortfolioRebalance }) {
  const leftover = toNumber(data.leftover_amount);

  const figures = [
    { label: "Aporte", value: formatCurrency(data.amount) },
    { label: "Alocado", value: formatCurrency(data.allocated_amount) },
    {
      label: "Sobra",
      value: formatCurrency(data.leftover_amount),
      muted: leftover === 0,
    },
    {
      label: "Patrimônio projetado",
      value: formatCurrency(data.projected_equity),
      hint: `hoje ${formatCurrency(data.total_equity)}`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aporte</CardTitle>
        <CardDescription>
          {leftover === 0
            ? "O valor coube inteiro nas cotas sugeridas."
            : `${formatCurrency(data.leftover_amount)} não pagam nem uma cota a mais.`}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {figures.map((figure) => (
          <div key={figure.label} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {figure.label}
            </span>
            <span className="text-xl font-semibold tabular-nums">
              {figure.value}
            </span>
            {figure.hint ? (
              <span className="text-xs text-subtle-foreground">{figure.hint}</span>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RebalanceShare({
  current,
  projected,
}: {
  current: number;
  projected: number;
}) {
  return (
    <span className="tabular-nums">
      {formatPercent(current)}
      <span className="px-1 text-subtle-foreground">→</span>
      {formatPercent(projected)}
    </span>
  );
}
