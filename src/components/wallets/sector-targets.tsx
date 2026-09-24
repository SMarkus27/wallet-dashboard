"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";

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
import { TargetsDonut } from "@/components/wallets/targets-donut";
import { ApiError, api } from "@/lib/api/client";
import { ASSET_TYPES, SECTORS, assetTypeLabel } from "@/lib/api/types";
import type {
  AssetType,
  SectorName,
  WalletAssetClassTarget,
  WalletSectorTarget,
} from "@/lib/api/types";
import { WALLET_MESSAGES, walletMessage } from "@/lib/wallets/messages";

const FULL_ALLOCATION = 100;

type Row = {
  external_id: string | null;
  asset_type: AssetType;
  sector: SectorName;
  percentage: number;
};

export function SectorTargets({
  sectors,
  assetClasses,
}: {
  sectors: WalletSectorTarget[];
  assetClasses: WalletAssetClassTarget[];
}) {
  const router = useRouter();

  const [rows, setRows] = useState<Row[]>(() =>
    sectors.map((target) => ({
      external_id: target.external_id,
      asset_type: target.asset_type,
      sector: target.sector as SectorName,
      percentage: target.percentage,
    })),
  );
  const [editing, setEditing] = useState(false);
  const [assetType, setAssetType] = useState<AssetType | null>(null);
  const [sector, setSector] = useState<SectorName | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const allowed = ASSET_TYPES.filter((type) =>
    assetClasses.some((target) => target.name === type.value),
  );

  if (allowed.length === 0) {
    return (
      <Alert>
        <TriangleAlertIcon />
        <AlertDescription>{WALLET_MESSAGES.missingAssetClass}</AlertDescription>
      </Alert>
    );
  }

  const taken = new Set(rows.map((row) => `${row.asset_type}|${row.sector}`));
  const canAdd =
    assetType !== null && sector !== null && !taken.has(`${assetType}|${sector}`);

  function addRow() {
    if (!assetType || !sector || !canAdd) return;

    setRows([
      ...rows,
      { external_id: null, asset_type: assetType, sector, percentage: 0 },
    ]);
    setSector(null);
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
      await api.delete(`/investor/wallets/sectors/${row.external_id}`);
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
      await api.post("/investor/wallets/sectors", {
        sectors: rows.map((row) => ({
          external_id: row.external_id ?? undefined,
          asset_type: row.asset_type,
          sector: row.sector,
          percentage: row.percentage,
        })),
      });
      setEditing(false);
      router.refresh();
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setPending(false);
    }
  }

  function closeEditor() {
    setRows(
      sectors.map((target) => ({
        external_id: target.external_id,
        asset_type: target.asset_type,
        sector: target.sector as SectorName,
        percentage: target.percentage,
      })),
    );
    setAssetType(null);
    setSector(null);
    setError(null);
    setEditing(false);
  }

  if (!editing) {
    const shares = sectors.map((target) => ({
      key: `${target.asset_type}|${target.sector}`,
      label: target.sector,
      caption: assetTypeLabel(target.asset_type),
      percentage: walletShare(target, assetClasses),
    }));

    return (
      <div className="flex flex-col gap-4">
        <TargetsDonut
          data={shares}
          total={shares.reduce((sum, share) => sum + share.percentage, 0)}
          totalLabel="Da carteira"
          emptyMessage="Nenhum setor distribuído ainda."
        />

        <p className="text-xs text-muted-foreground">
          As fatias mostram quanto cada setor representa da carteira inteira: a
          meta dentro da classe, multiplicada pela meta da classe.
        </p>

        <div className="flex justify-end border-t pt-4">
          <Button type="button" variant="outline" onClick={() => setEditing(true)}>
            <PencilIcon />
            Editar setores
          </Button>
        </div>
      </div>
    );
  }

  const overflowing = allowed.filter(
    (type) => totalFor(rows, type.value) > FULL_ALLOCATION,
  );

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
              <TableHead>Setor</TableHead>
              <TableHead className="w-40">Meta na classe (%)</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.external_id ?? `novo-${row.asset_type}-${row.sector}`}>
                <TableCell>{assetTypeLabel(row.asset_type)}</TableCell>
                <TableCell>{row.sector}</TableCell>
                <TableCell>
                  <Label htmlFor={`setor-${index}`} className="sr-only">
                    Meta de {row.sector} em {assetTypeLabel(row.asset_type)}
                  </Label>
                  <Input
                    id={`setor-${index}`}
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
                    aria-label={`Remover ${row.sector} de ${assetTypeLabel(row.asset_type)}`}
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
          Nenhum setor distribuído ainda.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="setor-classe">Classe</Label>
          <Select
            value={assetType ?? ""}
            onValueChange={(value) => setAssetType(value as AssetType)}
          >
            <SelectTrigger id="setor-classe">
              <SelectValue placeholder="Escolha a classe" />
            </SelectTrigger>
            <SelectContent>
              {allowed.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="setor-nome">Setor</Label>
          <Select
            value={sector ?? ""}
            onValueChange={(value) => setSector(value as SectorName)}
          >
            <SelectTrigger id="setor-nome">
              <SelectValue placeholder="Escolha o setor" />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={pending || !canAdd}
          onClick={addRow}
        >
          <PlusIcon />
          Adicionar
        </Button>
      </div>

      <div className="flex flex-col gap-3 border-t pt-4">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {allowed.map((type) => {
            const total = totalFor(rows, type.value);

            return (
              <p
                key={type.value}
                className={
                  total > FULL_ALLOCATION
                    ? "text-sm font-medium text-destructive"
                    : "text-sm text-muted-foreground"
                }
              >
                {type.label}: {total.toLocaleString("pt-BR")}%
              </p>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" disabled={pending} onClick={closeEditor}>
            Cancelar
          </Button>

          <Button
            type="button"
            disabled={pending || rows.length === 0 || overflowing.length > 0}
            onClick={save}
          >
            {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
            Salvar setores
          </Button>
        </div>
      </div>
    </div>
  );
}

function walletShare(
  target: WalletSectorTarget,
  assetClasses: WalletAssetClassTarget[],
) {
  const owner = assetClasses.find((item) => item.name === target.asset_type);

  return owner ? (target.percentage * owner.percentage) / FULL_ALLOCATION : 0;
}

function totalFor(rows: Row[], assetType: AssetType) {
  return rows
    .filter((row) => row.asset_type === assetType)
    .reduce((sum, row) => sum + row.percentage, 0);
}

function messageFor(cause: unknown) {
  return cause instanceof ApiError
    ? walletMessage(cause.status, cause.message)
    : WALLET_MESSAGES.unavailable;
}
