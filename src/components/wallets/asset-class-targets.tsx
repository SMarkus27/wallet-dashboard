"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircleIcon, PlusIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, api } from "@/lib/api/client";
import { ASSET_TYPES, assetTypeLabel } from "@/lib/api/types";
import type { AssetType, WalletAssetClassTarget } from "@/lib/api/types";
import { WALLET_MESSAGES, walletMessage } from "@/lib/wallets/messages";

const FULL_ALLOCATION = 100;

type Row = { external_id: string | null; name: AssetType; percentage: number };

export function AssetClassTargets({
  targets,
}: {
  targets: WalletAssetClassTarget[];
}) {
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>(() =>
    targets.map((target) => ({
      external_id: target.external_id,
      name: target.name,
      percentage: target.percentage,
    })),
  );
  const [chosen, setChosen] = useState<AssetType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const used = rows.map((row) => row.name);
  const available = ASSET_TYPES.filter((type) => !used.includes(type.value));
  const total = rows.reduce((sum, row) => sum + row.percentage, 0);
  const toAdd = chosen && available.some((type) => type.value === chosen) ? chosen : null;

  function addRow() {
    if (!toAdd) return;

    setRows([...rows, { external_id: null, name: toAdd, percentage: 0 }]);
    setChosen(null);
  }

  function changePercentage(index: number, value: string) {
    const percentage = Number(value);
    setRows(
      rows.map((row, position) =>
        position === index
          ? { ...row, percentage: Number.isFinite(percentage) ? percentage : 0 }
          : row,
      ),
    );
  }

  async function removeRow(index: number) {
    const row = rows[index];

    if (!row) return;

    if (!row.external_id) {
      setRows(rows.filter((_, position) => position !== index));
      return;
    }

    setPending(true);
    setError(null);

    try {
      await api.delete(`/investor/wallets/asset-classes/${row.external_id}`);
      setRows(rows.filter((_, position) => position !== index));
      router.refresh();
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setPending(false);
    }
  }

  async function save() {
    setPending(true);
    setError(null);

    try {
      await api.post("/investor/wallets/asset-classes", {
        asset_classes: rows.map((row) => ({
          external_id: row.external_id ?? undefined,
          name: row.name,
          percentage: row.percentage,
        })),
      });
      router.refresh();
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {rows.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Classe</TableHead>
              <TableHead className="w-40">Meta (%)</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.external_id ?? `novo-${row.name}`}>
                <TableCell>{assetTypeLabel(row.name)}</TableCell>
                <TableCell>
                  <Label htmlFor={`classe-${index}`} className="sr-only">
                    Meta para {assetTypeLabel(row.name)}
                  </Label>
                  <Input
                    id={`classe-${index}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="0.01"
                    value={row.percentage}
                    onChange={(event) => changePercentage(index, event.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => removeRow(index)}
                    aria-label={`Remover ${assetTypeLabel(row.name)}`}
                  >
                    <Trash2Icon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhuma classe definida. A soma das metas precisa fechar em 100%.
        </p>
      )}

      {available.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="nova-classe">Adicionar classe</Label>
            <Select
              value={toAdd ?? ""}
              onValueChange={(value) => setChosen(value as AssetType)}
            >
              <SelectTrigger id="nova-classe">
                <SelectValue placeholder="Escolha uma classe" />
              </SelectTrigger>
              <SelectContent>
                {available.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={pending || !toAdd}
            onClick={addRow}
          >
            <PlusIcon />
            Adicionar
          </Button>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4 border-t pt-4">
        <p
          className={
            total > FULL_ALLOCATION
              ? "text-sm font-medium text-destructive"
              : "text-sm text-muted-foreground"
          }
        >
          Total alocado: {total.toLocaleString("pt-BR")}% de {FULL_ALLOCATION}%
        </p>

        <Button
          type="button"
          disabled={pending || rows.length === 0 || total > FULL_ALLOCATION}
          onClick={save}
        >
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          Salvar metas
        </Button>
      </div>
    </div>
  );
}

function messageFor(cause: unknown) {
  return cause instanceof ApiError
    ? walletMessage(cause.status, cause.message)
    : WALLET_MESSAGES.unavailable;
}
