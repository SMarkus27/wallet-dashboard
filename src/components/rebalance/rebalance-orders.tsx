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
import type { RebalanceAsset } from "@/lib/api/types";
import { assetTypeLabel } from "@/lib/api/types";
import { formatCurrency, formatQuantity } from "@/lib/format";

export function RebalanceOrders({ assets }: { assets: RebalanceAsset[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>O que comprar</CardTitle>
        <CardDescription>
          Quantidades fechadas, pelo preço da última cotação. Nada é vendido: o
          que está acima do alvo volta ao lugar sendo diluído.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            O valor informado não paga uma cota sequer dos ativos em carteira.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ativo</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.external_id_str}>
                  <TableCell>
                    <span className="font-medium">{asset.ticker}</span>
                    {asset.name ? (
                      <span className="block text-xs text-muted-foreground">
                        {asset.name}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {assetTypeLabel(asset.asset_type)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.sector ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(asset.price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatQuantity(asset.quantity)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(asset.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
