"use client";

import { useState } from "react";

import { ShareDonut } from "@/components/charts/share-donut";
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
  defaultAssetType,
  measureFor,
  sectorShares,
} from "@/lib/portfolio/shares";

export function AllocationSharesCard({
  allocation,
}: {
  allocation: PortfolioAllocation;
}) {
  const [assetType, setAssetType] = useState(() =>
    defaultAssetType(allocation),
  );

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
            calculados {scope} — a tela abre na classe com a maior posição, e
            &quot;Todas as classes&quot; volta para a carteira inteira.
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
          <CardDescription>{measure}, da maior fatia para a menor.</CardDescription>
        </CardHeader>
        <CardContent>
          <ShareDonut
            data={sectors}
            measure={measure}
            emptyMessage="Nenhum setor com posição nesse recorte."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Porcentagem de cada ativo</CardTitle>
          <CardDescription>{measure}, da maior fatia para a menor.</CardDescription>
        </CardHeader>
        <CardContent>
          <ShareDonut
            data={assets}
            measure={measure}
            emptyMessage="Nenhum ativo com posição nesse recorte."
          />
        </CardContent>
      </Card>
    </div>
  );
}
