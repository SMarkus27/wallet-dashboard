import type { TaxPeriod, TaxPeriodStatus } from "@/lib/api/types";
import { assetTypeLabel } from "@/lib/api/types";
import { toNumber } from "@/lib/format";

export const MIN_DARF_AMOUNT = 10;

export const ANY_YEAR = "ALL";

export const ANY_TYPE = "ALL";

export const TAX_STATUS_LABELS: Record<TaxPeriodStatus, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  ISENTO: "Isento",
  SEM_IMPOSTO: "Sem imposto",
};

export const TAX_STATUS_VARIANTS: Record<
  TaxPeriodStatus,
  "default" | "outline" | "positive" | "warning"
> = {
  PENDENTE: "warning",
  PAGO: "positive",
  ISENTO: "outline",
  SEM_IMPOSTO: "outline",
};

export type TaxMonth = {
  reference: string;
  year: number;
  month: number;
  totalProfit: number;
  totalLoss: number;
  lossCompensation: number;
  taxableAmount: number;
  withholdingTax: number;
  taxDue: number;
  darfAmount: number;
  isPayable: boolean;
  hasPending: boolean;
  pendingDarf: number;
  sharedStatus: TaxPeriodStatus | null;
  periods: TaxPeriod[];
};

export function groupByMonth(periods: TaxPeriod[]): TaxMonth[] {
  const months = new Map<string, TaxPeriod[]>();

  for (const period of periods) {
    const reference = referenceOf(period);
    months.set(reference, [...(months.get(reference) ?? []), period]);
  }

  return [...months.entries()]
    .map(([reference, entries]) => toMonth(reference, entries))
    .sort((left, right) => right.reference.localeCompare(left.reference));
}

export function yearsOf(periods: TaxPeriod[]): number[] {
  return [...new Set(periods.map((period) => period.year))].sort(
    (left, right) => right - left,
  );
}

export function assetTypesOf(periods: TaxPeriod[]) {
  const seen = new Map<string, string>();

  for (const period of periods) {
    seen.set(period.asset_type, assetTypeLabel(period.asset_type));
  }

  return [...seen.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));
}

export function applyFilters(
  periods: TaxPeriod[],
  filters: { year: string; assetType: string },
): TaxPeriod[] {
  return periods.filter(
    (period) =>
      (filters.year === ANY_YEAR || String(period.year) === filters.year) &&
      (filters.assetType === ANY_TYPE || period.asset_type === filters.assetType),
  );
}

export function isUncollectible(darfAmount: number) {
  return darfAmount > 0 && darfAmount < MIN_DARF_AMOUNT;
}

function toMonth(reference: string, periods: TaxPeriod[]): TaxMonth {
  const darfAmount = sum(periods, (period) => period.darf_amount);
  const first = periods[0];

  // A situação é gravada por classe, então um mês pode ter a DARF de ações
  // quitada e a de FII em aberto. O pendente soma só as classes em aberto —
  // somar o mês inteiro faria o total parar de cair ao quitar a primeira.
  const pending = periods.filter(
    (period) =>
      period.status === "PENDENTE" && toNumber(period.darf_amount) > 0,
  );

  return {
    reference,
    year: first?.year ?? 0,
    month: first?.month ?? 0,
    totalProfit: sum(periods, (period) => period.total_profit),
    totalLoss: sum(periods, (period) => period.total_loss),
    lossCompensation: sum(periods, (period) => period.loss_compensation),
    taxableAmount: sum(periods, (period) => period.taxable_amount),
    withholdingTax: sum(periods, (period) => period.total_withholding_tax),
    taxDue: sum(periods, (period) => period.total_tax_due),
    darfAmount,
    isPayable: darfAmount >= MIN_DARF_AMOUNT,
    hasPending: pending.length > 0,
    pendingDarf: darfAmount >= MIN_DARF_AMOUNT ? sum(pending, (p) => p.darf_amount) : 0,
    sharedStatus: sharedStatusOf(periods),
    periods: [...periods].sort((left, right) =>
      left.asset_type.localeCompare(right.asset_type, "pt-BR"),
    ),
  };
}

function sharedStatusOf(periods: TaxPeriod[]): TaxPeriodStatus | null {
  const statuses = new Set(periods.map((period) => period.status));
  const [only] = statuses;

  return statuses.size === 1 && only !== undefined ? only : null;
}

function referenceOf(period: TaxPeriod) {
  return `${String(period.year).padStart(4, "0")}-${String(period.month).padStart(2, "0")}`;
}

function sum<T>(items: T[], pick: (item: T) => string | number) {
  return items.reduce((total, item) => total + toNumber(pick(item)), 0);
}
