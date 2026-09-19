const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});

const shortMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  timeZone: "UTC",
});

const longMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: string | number | null | undefined) {
  return currencyFormatter.format(toNumber(value));
}

export function formatCompactCurrency(value: string | number | null | undefined) {
  return compactCurrencyFormatter.format(toNumber(value));
}

export function formatPercent(value: string | number | null | undefined) {
  return `${percentFormatter.format(toNumber(value))}%`;
}

export function formatSignedPercent(value: string | number | null | undefined) {
  const parsed = toNumber(value);
  const sign = parsed > 0 ? "+" : "";
  return `${sign}${percentFormatter.format(parsed)}%`;
}

export function formatQuantity(value: string | number | null | undefined) {
  return quantityFormatter.format(toNumber(value));
}

function referenceToDate(reference: string) {
  const [year, month] = reference.split("-");
  if (!year || !month) return null;
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1));
}

export function formatMonthReference(reference: string) {
  const date = referenceToDate(reference);
  if (!date) return reference;

  const month = shortMonthFormatter.format(date).replace(".", "");
  return `${month}/${String(date.getUTCFullYear()).slice(2)}`;
}

export function formatMonthLong(reference: string) {
  const date = referenceToDate(reference);
  return date ? longMonthFormatter.format(date) : reference;
}

export function formatIsoDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
}

export function monthName(month: number) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, month - 1, 1)),
  );
}
