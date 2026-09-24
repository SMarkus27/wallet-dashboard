import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AssetClassTargets } from "@/components/wallets/asset-class-targets";
import { SectorTargets } from "@/components/wallets/sector-targets";
import { WalletCreateForm } from "@/components/wallets/wallet-create-form";
import { Badge } from "@/components/ui/badge";
import { getWallets } from "@/lib/api/wallets";
import { readActiveWalletId } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Carteiras" };

export default async function CarteirasPage() {
  const [{ wallet: wallets }, activeId] = await Promise.all([
    getWallets(),
    readActiveWalletId(),
  ]);

  const active =
    wallets.find((item) => item.external_id === activeId) ?? wallets[0];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Carteiras</CardTitle>
          <CardDescription>
            Cada carteira guarda as próprias metas de classe e de setor.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {wallets.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {wallets.map((item) => (
                <li
                  key={item.external_id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 font-medium">
                    {item.name || "Sem nome"}
                    {item.external_id === active?.external_id ? (
                      <Badge variant="outline">Em uso</Badge>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground">
                    {item.asset_class.length} classes · {item.sectors.length} setores
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma carteira ainda.
            </p>
          )}

          <WalletCreateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metas por classe de ativo</CardTitle>
          <CardDescription>
            Quanto da carteira cada classe deve ocupar, em{" "}
            <strong className="font-medium text-foreground">
              {active?.name || "sua carteira"}
            </strong>
            . A soma não pode passar de 100%.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssetClassTargets targets={active?.asset_class ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metas por setor</CardTitle>
          <CardDescription>
            O percentual de um setor é uma fatia da classe dele, não da carteira
            inteira. Por isso a soma de 100% é conferida dentro de cada classe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectorTargets
            sectors={active?.sectors ?? []}
            assetClasses={active?.asset_class ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
