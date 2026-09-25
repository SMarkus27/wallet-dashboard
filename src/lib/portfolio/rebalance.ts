import type {
  MissingTarget,
  PortfolioRebalance,
  RebalanceDimension,
  RebalanceGroup,
} from "@/lib/api/types";
import { ASSET_TYPES } from "@/lib/api/types";
import { toNumber } from "@/lib/format";

export const ANY = "ALL";

export const MIN_AMOUNT = 0.01;

export const DIMENSION_LABELS: Record<RebalanceDimension, string> = {
  ASSET_TYPE: "Classe",
  SECTOR: "Setor",
};

export function assetTypeOptions() {
  return [
    { value: ANY, label: "Todas as classes" },
    ...ASSET_TYPES.map((type) => ({ value: type.value, label: type.label })),
  ];
}

export function amountOf(value: string): number | null {
  const parsed = Number(value.replace(",", "."));

  if (!Number.isFinite(parsed) || parsed < MIN_AMOUNT) return null;

  return parsed;
}

export type GroupRow = {
  key: string;
  label: string;
  target: number;
  current: number;
  projected: number;
  amount: number;
  moved: number;
};

export function toGroupRows(groups: RebalanceGroup[]): GroupRow[] {
  return groups
    .map((group) => {
      const current = toNumber(group.current_percentage);
      const projected = toNumber(group.projected_percentage);

      return {
        key: `${group.asset_type}:${group.name}`,
        label: group.label,
        target: toNumber(group.target_percentage),
        current,
        projected,
        amount: toNumber(group.amount),
        moved: projected - current,
      };
    })
    .sort((left, right) => right.amount - left.amount);
}

export function distanceToTarget(row: GroupRow) {
  return Math.abs(row.target - row.projected) - Math.abs(row.target - row.current);
}

export function groupMissingTargets(missing: MissingTarget[]) {
  const byDimension = new Map<RebalanceDimension, MissingTarget[]>();

  for (const target of missing) {
    byDimension.set(target.dimension, [
      ...(byDimension.get(target.dimension) ?? []),
      target,
    ]);
  }

  return [...byDimension.entries()].map(([dimension, targets]) => ({
    dimension,
    label: DIMENSION_LABELS[dimension],
    targets,
  }));
}

export function isFullyAllocated(rebalance: PortfolioRebalance) {
  return toNumber(rebalance.leftover_amount) === 0;
}
