import type { Metadata } from "next";

import { AllocationDonut } from "@/components/charts/allocation-donut";
import { EquityChart } from "@/components/charts/equity-chart";
import { AssetTypeTable } from "@/components/summary/asset-type-table";
import { SummaryStats } from "@/components/summary/summary-stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllocation, getEquityHistory, getOverview } from "@/lib/api/portfolio";
import { donutSlices, groupByAssetType } from "@/lib/portfolio/summary";

export const metadata: Metadata = { title: "Resumo" };

export default async function ResumoPage() {
  const [overview, allocation, history] = await Promise.all([
    getOverview(),
    getAllocation(),
    getEquityHistory(),
  ]);

  const groups = groupByAssetType(allocation);

  return (
    <div className="flex flex-col gap-6">
      <SummaryStats overview={overview} />

      <Card>
        <CardHeader>
          <CardTitle>Evolução do patrimônio</CardTitle>
          <CardDescription>
            A distância entre as duas linhas é o ganho de capital não realizado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.months.length > 0 ? (
            <EquityChart months={history.months} />
          ) : (
            <EmptyState message="Registre uma negociação para o histórico começar." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Composição por tipo de ativo</CardTitle>
          <CardDescription>
            Participação real de cada classe, comparada com a meta da carteira.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AllocationDonut slices={donutSlices(allocation.asset_types)} />
        </CardContent>
      </Card>

      {groups.length > 0 ? (
        groups.map((group) => <AssetTypeTable key={group.name} group={group} />)
      ) : (
        <Card>
          <CardContent className="pt-6">
            <EmptyState message="A carteira ainda não tem posições em aberto." />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">{message}</p>
  );
}
