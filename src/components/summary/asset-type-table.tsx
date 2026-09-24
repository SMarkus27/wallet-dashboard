import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssetTypeGroup } from "@/lib/portfolio/summary";
import { formatCurrency, formatPercent, formatQuantity } from "@/lib/format";

export function AssetTypeTable({ group }: { group: AssetTypeGroup }) {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-6 pt-5 pb-3">
        <h3 className="text-sm font-semibold tracking-tight">{group.label}</h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {formatCurrency(group.marketValue)}
          </span>
          <span className="mx-2 text-subtle-foreground">·</span>
          {formatPercent(group.realPercentage)} da carteira
          <span className="mx-2 text-subtle-foreground">·</span>
          ideal {formatPercent(group.idealPercentage)}
        </p>
      </header>

      <div className="px-2 pb-3">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Ticker</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Preço médio</TableHead>
              <TableHead className="text-right">Preço atual</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right">% na carteira</TableHead>
              <TableHead className="text-right">
                % ideal
                <span className="block text-[10px] font-normal text-subtle-foreground">
                  do setor
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {group.assets.map((asset) => (
              <TableRow key={asset.external_id_str}>
                <TableCell>
                  <span className="font-medium">{asset.ticker}</span>
                  {asset.sectorLabel ? (
                    <span className="block text-xs text-muted-foreground">
                      {asset.sectorLabel}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  {formatQuantity(asset.quantity)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(asset.mean_price)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(asset.price)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(asset.market_value)}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercent(asset.percentage)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {asset.sectorIdealPercentage === null
                    ? "—"
                    : formatPercent(asset.sectorIdealPercentage)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
