import type { PortfolioAllocation } from "@/lib/api/types";
import { ASSET_TYPES, assetTypeLabel } from "@/lib/api/types";
import type { ShareDatum } from "@/components/charts/share-bar-chart";
import { toNumber } from "@/lib/format";

export const ALL_TYPES = "ALL";

export const WALLET_MEASURE = "Participação na carteira";

export const CLASS_MEASURE = "Participação na classe";

export function measureFor(assetType: string) {
  return assetType === ALL_TYPES ? WALLET_MEASURE : CLASS_MEASURE;
}

export function assetTypeOptions(allocation: PortfolioAllocation) {
  return [
    { value: ALL_TYPES, label: "Todas as classes" },
    ...allocation.asset_types
      .map((slice) => ({
        value: slice.name,
        label: assetTypeLabel(slice.name, slice.label),
      }))
      .sort((left, right) => left.label.localeCompare(right.label, "pt-BR")),
  ];
}

export function sectorShares(
  allocation: PortfolioAllocation,
  assetType: string,
): ShareDatum[] {
  const selected = allocation.sectors.filter(
    (slice) =>
      (assetType === ALL_TYPES || slice.asset_type === assetType) &&
      toNumber(slice.market_value) > 0,
  );

  const shared = repeatedLabels(selected.map((slice) => slice.label));

  return selected
    .map((slice) => ({
      key: `${slice.asset_type}-${slice.name}`,
      label: shared.has(slice.label)
        ? `${slice.label} · ${shortAssetType(slice.asset_type)}`
        : slice.label,
      caption:
        assetType === ALL_TYPES ? assetTypeLabel(slice.asset_type) : null,
      percentage: toNumber(
        assetType === ALL_TYPES
          ? slice.wallet_real_percentage
          : slice.real_percentage,
      ),
      idealPercentage: toNumber(
        assetType === ALL_TYPES
          ? slice.wallet_ideal_percentage
          : slice.ideal_percentage,
      ),
      value: toNumber(slice.market_value),
    }))
    .sort((left, right) => right.percentage - left.percentage);
}

function repeatedLabels(labels: string[]): Set<string> {
  const seen = new Set<string>();
  const repeated = new Set<string>();

  for (const label of labels) {
    if (seen.has(label)) repeated.add(label);
    seen.add(label);
  }

  return repeated;
}

function shortAssetType(name: string) {
  return ASSET_TYPES.find((item) => item.name === name)?.value ?? name;
}

export function assetShares(
  allocation: PortfolioAllocation,
  assetType: string,
): ShareDatum[] {
  const selected = allocation.assets.filter(
    (asset) => assetType === ALL_TYPES || asset.asset_type === assetType,
  );

  const base =
    assetType === ALL_TYPES
      ? toNumber(allocation.total_equity)
      : selected.reduce((total, asset) => total + toNumber(asset.market_value), 0);

  return selected
    .map((asset) => ({
      key: asset.external_id_str,
      label: asset.ticker,
      caption: assetTypeLabel(asset.asset_type),
      percentage: share(toNumber(asset.market_value), base),
      idealPercentage: null,
      value: toNumber(asset.market_value),
    }))
    .sort((left, right) => right.percentage - left.percentage);
}

function share(value: number, base: number) {
  return base > 0 ? Number(((value / base) * 100).toFixed(2)) : 0;
}
