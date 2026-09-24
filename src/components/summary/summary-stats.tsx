import type { PortfolioOverview } from "@/lib/api/types";
import {
  formatCurrency,
  formatSignedPercent,
  toNumber,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export function SummaryStats({ overview }: { overview: PortfolioOverview }) {
  const capitalGain = toNumber(overview.capital_gain.total);
  const profitability = toNumber(overview.profitability.total_percentage);

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-border bg-surface px-6 py-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">Patrimônio total</p>
        <p className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {formatCurrency(overview.total_equity)}
        </p>
        <p className={cn("text-sm font-medium", toneOf(profitability))}>
          {formatSignedPercent(profitability)} desde o início
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4 lg:grid-cols-4">
        <Stat label="Valor aplicado" value={formatCurrency(overview.invested_amount)} />
        <Stat
          label="Ganho de capital"
          value={formatCurrency(capitalGain)}
          tone={toneOf(capitalGain)}
        />
        <Stat
          label="Proventos em 12 meses"
          value={formatCurrency(overview.earnings.last_12_months)}
        />
        <Stat
          label="Rentabilidade em 12 meses"
          value={formatSignedPercent(
            overview.profitability.last_12_months_percentage,
          )}
          tone={toneOf(toNumber(overview.profitability.last_12_months_percentage))}
        />
      </dl>
    </section>
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
