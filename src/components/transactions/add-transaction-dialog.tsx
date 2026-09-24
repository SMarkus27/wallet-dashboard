"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  LoaderCircleIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { AssetPicker } from "@/components/transactions/asset-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ASSET_TYPES } from "@/lib/api/types";
import type { AssetType, CatalogAsset, TradedType } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import {
  TRANSACTION_MESSAGES,
  transactionMessage,
} from "@/lib/transactions/messages";
import { cn } from "@/lib/utils";

const DEFAULT_TYPE: AssetType = "AÇÃO";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AddTransactionDialog() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [operation, setOperation] = useState<TradedType>("BUY");
  const [assetType, setAssetType] = useState<AssetType>(DEFAULT_TYPE);
  const [asset, setAsset] = useState<CatalogAsset | null>(null);
  const [tradedAt, setTradedAt] = useState(today);
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const buying = operation === "BUY";
  const gross = Number(quantity || 0) * Number(price || 0);
  const costs = Number(fees || 0);
  const total = buying ? gross + costs : gross - costs;

  function reset() {
    setOperation("BUY");
    setAssetType(DEFAULT_TYPE);
    setAsset(null);
    setTradedAt(today());
    setQuantity("1");
    setPrice("");
    setFees("0");
    setError(null);
  }

  function change(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!asset) {
      setError(TRANSACTION_MESSAGES.missingAsset);
      return;
    }

    if (tradedAt > today()) {
      setError(TRANSACTION_MESSAGES.futureDate);
      return;
    }

    setPending(true);
    setError(null);

    try {
      await api.post("/investor/transactions", {
        asset_external_id: asset.external_id,
        type: operation,
        quantity: Number(quantity),
        price: Number(price),
        fees: Number(fees || 0),
        traded_at: `${tradedAt}T12:00:00`,
      });

      change(false);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? transactionMessage(cause.status, cause.message)
          : TRANSACTION_MESSAGES.unavailable,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          Adicionar transação
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar transação</DialogTitle>
          <DialogDescription>
            A negociação entra na carteira e na apuração do período.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={buying ? "default" : "outline"}
              onClick={() => setOperation("BUY")}
            >
              <ArrowUpIcon />
              Compra
            </Button>
            <Button
              type="button"
              variant={buying ? "outline" : "default"}
              onClick={() => setOperation("SELL")}
            >
              <ArrowDownIcon />
              Venda
            </Button>
          </div>

          {error ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="tipo-ativo">Tipo de ativo</Label>
            <Select
              value={assetType}
              onValueChange={(value) => {
                setAssetType(value as AssetType);
                setAsset(null);
              }}
            >
              <SelectTrigger id="tipo-ativo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AssetPicker
            assetType={assetType}
            selected={asset}
            onSelect={setAsset}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                max={today()}
                required
                value={tradedAt}
                onChange={(event) => setTradedAt(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                inputMode="numeric"
                min={1}
                step="1"
                required
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="preco">Preço em R$</Label>
              <Input
                id="preco"
                type="number"
                inputMode="decimal"
                min={0.01}
                step="0.01"
                required
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="custos">Outros custos</Label>
              <Input
                id="custos"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={fees}
                onChange={(event) => setFees(event.target.value)}
              />
            </div>
          </div>

          <div
            className={cn(
              "flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm",
            )}
          >
            <span className="text-muted-foreground">
              {buying ? "Valor total" : "Valor líquido"}
            </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(Number.isFinite(total) ? total : 0)}
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => change(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={pending || !asset || !price}>
              {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
