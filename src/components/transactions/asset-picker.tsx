"use client";

import { useEffect, useState } from "react";
import { LoaderCircleIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import type { AssetType, CatalogAsset, CatalogAssetPage } from "@/lib/api/types";

const TYPING_PAUSE = 300;

const MIN_TERM = 2;

const RESULT_LIMIT = 8;

export function AssetPicker({
  assetType,
  selected,
  onSelect,
}: {
  assetType: AssetType;
  selected: CatalogAsset | null;
  onSelect: (asset: CatalogAsset | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<CatalogAsset[]>([]);
  const [searching, setSearching] = useState(false);

  const trimmed = term.trim();
  const searchable = !selected && trimmed.length >= MIN_TERM;
  const visible = searchable ? results : [];

  useEffect(() => {
    if (!searchable) return;

    let current = true;

    const timer = setTimeout(async () => {
      setSearching(true);

      try {
        const page = await api.get<CatalogAssetPage>("/investor/assets", {
          search: trimmed,
          type: assetType,
          limit: RESULT_LIMIT,
        });

        if (current) setResults(page?.items ?? []);
      } catch {
        if (current) setResults([]);
      } finally {
        if (current) setSearching(false);
      }
    }, TYPING_PAUSE);

    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [trimmed, assetType, searchable]);

  function clear() {
    onSelect(null);
    setTerm("");
    setResults([]);
  }

  if (selected) {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor="ativo-escolhido">Ativo</Label>
        <div
          id="ativo-escolhido"
          className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <span>
            <span className="font-medium">{selected.ticker}</span>
            {selected.name ? (
              <span className="text-muted-foreground"> · {selected.name}</span>
            ) : null}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            aria-label="Trocar de ativo"
          >
            <XIcon />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="ativo">Ativo</Label>
      <Input
        id="ativo"
        name="ativo"
        autoComplete="off"
        placeholder="Código ou nome do ativo"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />

      {searchable && searching ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <LoaderCircleIcon className="size-3 animate-spin" />
          Procurando
        </p>
      ) : null}

      {visible.length > 0 ? (
        <ul className="max-h-48 overflow-y-auto rounded-md border">
          {visible.map((asset) => (
            <li key={asset.external_id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => onSelect(asset)}
              >
                <span className="font-medium">{asset.ticker}</span>
                <span className="truncate text-muted-foreground">{asset.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!searching && searchable && visible.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhum ativo dessa classe com esse código ou nome.
        </p>
      ) : null}
    </div>
  );
}
