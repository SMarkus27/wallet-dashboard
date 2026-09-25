import type {
  EarningKind,
  EarningPayment,
  PortfolioEarnings,
  PortfolioScheduledEarnings,
  ScheduledEarning,
} from "@/lib/api/types";
import { assetTypeLabel } from "@/lib/api/types";
import { toNumber } from "@/lib/format";

export const EARNING_STATUSES = ["ALL", "RECEIVED", "SCHEDULED"] as const;

export type EarningStatus = (typeof EARNING_STATUSES)[number];

export const EARNING_STATUS_LABELS: Record<EarningStatus, string> = {
  ALL: "Recebidos e futuros",
  RECEIVED: "Recebidos",
  SCHEDULED: "Futuros",
};

export const EARNING_KIND_LABELS: Record<EarningKind, string> = {
  DIVIDEND: "Dividendo",
  JCP: "JCP",
  DISTRIBUTION: "Rendimento",
};

export const GRANULARITIES = ["MONTH", "YEAR"] as const;

export type Granularity = (typeof GRANULARITIES)[number];

export const GRANULARITY_LABELS: Record<Granularity, string> = {
  MONTH: "Mês",
  YEAR: "Ano",
};

export const ANY = "ALL";

export type EarningRow = {
  id: string;
  reference: string;
  date: string;
  ticker: string;
  assetType: string;
  assetTypeLabel: string;
  sectorLabel: string | null;
  kind: EarningKind;
  status: Exclude<EarningStatus, "ALL">;
  quantity: number;
  price: number;
  amount: number;
};

export type EarningFilters = {
  status: EarningStatus;
  ticker: string;
  assetType: string;
};

export type MonthGroup = {
  reference: string;
  total: number;
  rows: EarningRow[];
};

// O gráfico responde "quanto entrou por mês". Separar dividendo, JCP e
// rendimento em três barras respondia outra pergunta, que a tabela abaixo
// já responde linha a linha.
export type SeriesPoint = {
  reference: string;
  total: number;
};

export function toRows(
  received: PortfolioEarnings,
  scheduled: PortfolioScheduledEarnings,
): EarningRow[] {
  return [
    ...received.payments.map(fromReceived),
    ...scheduled.payments.map(fromScheduled),
  ].sort((left, right) => right.date.localeCompare(left.date));
}

export function applyFilters(
  rows: EarningRow[],
  filters: EarningFilters,
): EarningRow[] {
  return rows.filter(
    (row) =>
      (filters.status === ANY || row.status === filters.status) &&
      (filters.ticker === ANY || row.ticker === filters.ticker) &&
      (filters.assetType === ANY || row.assetType === filters.assetType),
  );
}

export function groupByMonth(rows: EarningRow[]): MonthGroup[] {
  const groups = new Map<string, EarningRow[]>();

  for (const row of rows) {
    groups.set(row.reference, [...(groups.get(row.reference) ?? []), row]);
  }

  return [...groups.entries()]
    .map(([reference, entries]) => ({
      reference,
      total: sum(entries),
      rows: entries,
    }))
    .sort((left, right) => right.reference.localeCompare(left.reference));
}

export function toSeries(
  rows: EarningRow[],
  granularity: Granularity,
): SeriesPoint[] {
  const buckets = new Map<string, SeriesPoint>();

  for (const row of rows) {
    const key = granularity === "YEAR" ? row.reference.slice(0, 4) : row.reference;
    const point = buckets.get(key) ?? { reference: key, total: 0 };

    point.total += row.amount;
    buckets.set(key, point);
  }

  return [...buckets.values()].sort((left, right) =>
    left.reference.localeCompare(right.reference),
  );
}

export function tickersOf(rows: EarningRow[]): string[] {
  return [...new Set(rows.map((row) => row.ticker))].sort();
}

export function assetTypesOf(rows: EarningRow[]) {
  const seen = new Map<string, string>();

  for (const row of rows) seen.set(row.assetType, row.assetTypeLabel);

  return [...seen.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));
}

export function totalOf(rows: EarningRow[]) {
  return sum(rows);
}

function fromReceived(payment: EarningPayment): EarningRow {
  return {
    id: payment.external_id_str,
    reference: payment.reference,
    date: payment.traded_at,
    ticker: payment.ticker,
    assetType: payment.asset_type,
    assetTypeLabel: assetTypeLabel(payment.asset_type),
    sectorLabel: payment.sector_label,
    kind: payment.type,
    status: "RECEIVED",
    quantity: payment.quantity,
    price: toNumber(payment.price),
    amount: toNumber(payment.net),
  };
}

function fromScheduled(payment: ScheduledEarning): EarningRow {
  return {
    id: payment.external_id_str,
    reference: payment.reference,
    date: payment.payment_date,
    ticker: payment.ticker,
    assetType: payment.asset_type,
    assetTypeLabel: assetTypeLabel(payment.asset_type),
    sectorLabel: payment.sector_label,
    kind: payment.type,
    status: "SCHEDULED",
    quantity: payment.quantity,
    price: toNumber(payment.price),
    amount: toNumber(payment.amount),
  };
}

function sum(rows: EarningRow[]) {
  return rows.reduce((total, row) => total + row.amount, 0);
}
