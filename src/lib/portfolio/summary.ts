import type { ShareDatum } from "@/components/charts/share-donut";
import type {
  AllocationSlice,
  AssetAllocation,
  PortfolioAllocation,
  SectorAllocationSlice,
} from "@/lib/api/types";
import { assetTypeLabel } from "@/lib/api/types";
import { toNumber } from "@/lib/format";

export type AssetRow = AssetAllocation & {
  sectorLabel: string | null;
  sectorIdealPercentage: number | null;
};

export type AssetTypeGroup = {
  name: string;
  label: string;
  marketValue: number;
  realPercentage: number;
  idealPercentage: number;
  assets: AssetRow[];
};

export function groupByAssetType(
  allocation: PortfolioAllocation,
): AssetTypeGroup[] {
  const slices = new Map(allocation.asset_types.map((slice) => [slice.name, slice]));
  const sectors = sectorIndex(allocation.sectors);
  const grouped = new Map<string, AssetRow[]>();

  for (const asset of allocation.assets) {
    const rows = grouped.get(asset.asset_type) ?? [];
    rows.push(toRow(asset, sectors));
    grouped.set(asset.asset_type, rows);
  }

  return [...grouped.entries()]
    .map(([name, assets]) => toGroup(name, assets, slices.get(name)))
    .sort((left, right) => right.marketValue - left.marketValue);
}

export function assetTypeShares(slices: AllocationSlice[]): ShareDatum[] {
  return slices.map((slice) => ({
    key: slice.name,
    label: assetTypeLabel(slice.name, slice.label),
    value: toNumber(slice.market_value),
    percentage: toNumber(slice.real_percentage),
    idealPercentage: toNumber(slice.ideal_percentage),
  }));
}

function toGroup(
  name: string,
  assets: AssetRow[],
  slice: AllocationSlice | undefined,
): AssetTypeGroup {
  return {
    name,
    label: assetTypeLabel(name, slice?.label),
    marketValue: slice
      ? toNumber(slice.market_value)
      : assets.reduce((total, asset) => total + toNumber(asset.market_value), 0),
    realPercentage: toNumber(slice?.real_percentage),
    idealPercentage: toNumber(slice?.ideal_percentage),
    assets: [...assets].sort(
      (left, right) => toNumber(right.market_value) - toNumber(left.market_value),
    ),
  };
}

function toRow(
  asset: AssetAllocation,
  sectors: Map<string, SectorAllocationSlice>,
): AssetRow {
  const sector = asset.sector
    ? sectors.get(sectorKey(asset.asset_type, asset.sector))
    : undefined;

  return {
    ...asset,
    sectorLabel: sector?.label ?? asset.sector,
    sectorIdealPercentage: sector
      ? toNumber(sector.wallet_ideal_percentage)
      : null,
  };
}

function sectorIndex(slices: SectorAllocationSlice[]) {
  return new Map(
    slices.map((slice) => [sectorKey(slice.asset_type, slice.name), slice]),
  );
}

function sectorKey(assetType: string, sector: string) {
  return `${assetType}::${sector}`;
}
