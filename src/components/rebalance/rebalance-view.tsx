"use client";

import { useEffect, useState } from "react";
import { LoaderCircleIcon, TriangleAlertIcon } from "lucide-react";

import { MissingTargets } from "@/components/rebalance/missing-targets";
import { RebalanceGroups } from "@/components/rebalance/rebalance-groups";
import { RebalanceOrders } from "@/components/rebalance/rebalance-orders";
import { RebalanceSummary } from "@/components/rebalance/rebalance-summary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError, api } from "@/lib/api/client";
import type { AssetType, PortfolioRebalance } from "@/lib/api/types";
import {
  ANY,
  MIN_AMOUNT,
  amountOf,
  assetTypeOptions,
} from "@/lib/portfolio/rebalance";

const TYPING_PAUSE = 400;

const UNAVAILABLE = "Não foi possível calcular o aporte agora.";

export function RebalanceView() {
  const [value, setValue] = useState("");
  const [assetType, setAssetType] = useState<string>(ANY);
  const [data, setData] = useState<PortfolioRebalance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const amount = amountOf(value);

  // Zerar `data` e `error` aqui dentro seria escrever estado no efeito. O
  // que vale é derivar na renderização: sem valor, nada é exibido.
  const rebalance = amount === null ? null : data;
  const failure = amount === null ? null : error;

  useEffect(() => {
    if (amount === null) return;

    let current = true;

    const timer = setTimeout(async () => {
      setPending(true);

      try {
        const result = await api.get<PortfolioRebalance>(
          "/investor/portfolio/rebalance",
          { amount, asset_type: assetType === ANY ? undefined : assetType },
        );

        if (current) {
          setData(result);
          setError(null);
        }
      } catch (cause) {
        if (current) {
          setData(null);
          setError(cause instanceof ApiError ? cause.message : UNAVAILABLE);
        }
      } finally {
        if (current) setPending(false);
      }
    }, TYPING_PAUSE);

    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [amount, assetType]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-48 flex-col gap-1.5">
          <Label htmlFor="aporte">Quanto você vai aportar</Label>
          <Input
            id="aporte"
            type="number"
            inputMode="decimal"
            min={MIN_AMOUNT}
            step="0.01"
            placeholder="5000"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>

        <div className="flex min-w-48 flex-col gap-1.5">
          <Label htmlFor="classe">Classe</Label>
          <Select
            value={assetType}
            onValueChange={(next) => setAssetType(next as AssetType | typeof ANY)}
          >
            <SelectTrigger id="classe">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assetTypeOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {pending ? (
          <p className="flex items-center gap-2 pb-2 text-xs text-muted-foreground">
            <LoaderCircleIcon className="size-3 animate-spin" />
            Calculando
          </p>
        ) : null}
      </div>

      {failure ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      ) : null}

      {amount === null ? (
        <p className="text-sm text-muted-foreground">
          Informe o valor do aporte para ver onde ele rende mais alinhamento com
          as suas metas. Nada é lançado: a sugestão não cria transação.
        </p>
      ) : null}

      {rebalance ? (
        <>
          <RebalanceSummary data={rebalance} />
          <RebalanceOrders assets={rebalance.assets} />
          <MissingTargets missing={rebalance.missing_targets} />

          {rebalance.asset_type === null ? (
            <RebalanceGroups
              title="Por classe"
              description="O aporte se divide proporcionalmente ao que falta para cada classe chegar à meta."
              groups={rebalance.asset_types}
            />
          ) : null}

          <RebalanceGroups
            title="Por setor"
            description="Dentro de cada classe, a mesma conta entre os setores que você já tem em carteira."
            groups={rebalance.sectors}
          />
        </>
      ) : null}
    </div>
  );
}
