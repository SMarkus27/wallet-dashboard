"use client";

import { useState } from "react";

import { ShareBarChart } from "@/components/charts/share-bar-chart";
import { FilterRow } from "@/components/filters/filter-row";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PortfolioAllocation } from "@/lib/api/types";
import {
  ALL_TYPES,
  assetShares,
  assetTypeOptions,
  measureFor,
  sectorShares,
} from "@/lib/portfolio/shares";

export function AllocationSharesCard({
  allocation,
}: {
  allocation: PortfolioAllocation;
}) {
  const [assetType, setAssetType] = useState(ALL_TYPES);

  const measure = measureFor(assetType);
  const sectors = sectorShares(allocation, assetType);
  const assets = assetShares(allocation, assetType);

  const scope =
    assetType === ALL_TYPES
      ? "sobre a carteira inteira"
      : "sobre a classe selecionada";

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Recorte</CardTitle>
          <CardDescription>
            O mesmo filtro vale para os dois gráficos abaixo. Os percentuais são
            calculados {scope}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilterRow
            fields={[
              {
                id: "shares-asset-type",
                label: "Tipo de ativo",
                value: assetType,
                onChange: setAssetType,
                options: assetTypeOptions(allocation),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Porcentagem real por setor</CardTitle>
          <CardDescription>{measure}, do maior para o menor.</CardDescription>
        </CardHeader>
        <CardContent>
          <ShareBarChart
            data={sectors}
            measure={measure}
            emptyMessage="Nenhum setor com posição nesse recorte."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Porcentagem de cada ativo</CardTitle>
          <CardDescription>{measure}, do maior para o menor.</CardDescription>
        </CardHeader>
        <CardContent>
          <ShareBarChart
            data={assets}
            measure={measure}
            emptyMessage="Nenhum ativo com posição nesse recorte."
          />
        </CardContent>
      </Card>
    </div>
  );
}
