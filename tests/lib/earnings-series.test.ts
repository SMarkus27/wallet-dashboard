import { describe, expect, it } from "vitest";

import type {
  EarningRow,
  Granularity,
  SeriesPoint,
} from "@/lib/portfolio/earnings";
import {
  EARNING_KIND_LABELS,
  toSeries,
  totalOf,
} from "@/lib/portfolio/earnings";

function row(overrides: Partial<EarningRow> = {}): EarningRow {
  return {
    id: "1",
    reference: "2026-09",
    date: "2026-09-15",
    ticker: "PETR4",
    assetType: "AÇÃO",
    assetTypeLabel: "Ação",
    sectorLabel: "Energia",
    kind: "DIVIDEND",
    status: "RECEIVED",
    quantity: 100,
    price: 1,
    amount: 100,
    ...overrides,
  };
}

function firstPoint(
  rows: EarningRow[],
  granularity: Granularity = "MONTH",
): SeriesPoint {
  const [point] = toSeries(rows, granularity);

  if (!point) throw new Error("A série veio vazia.");

  return point;
}

describe("toSeries", () => {
  it("keeps a fund distribution out of the dividend bucket", () => {
    // Antes de existir o balde, o `else` mandava qualquer coisa que não fosse
    // JCP para dividendos: o rendimento de FII aparecia como dividendo.
    const point = firstPoint([
      row({ kind: "DIVIDEND", amount: 100 }),
      row({ id: "2", kind: "JCP", amount: 50 }),
      row({ id: "3", kind: "DISTRIBUTION", ticker: "HGLG11", amount: 351 }),
    ]);

    expect(point.dividends).toBe(100);
    expect(point.interestOnEquity).toBe(50);
    expect(point.distributions).toBe(351);
  });

  it("adds the three buckets up to the total", () => {
    const rows = [
      row({ kind: "DIVIDEND", amount: 100 }),
      row({ id: "2", kind: "JCP", amount: 50 }),
      row({ id: "3", kind: "DISTRIBUTION", amount: 351 }),
    ];

    const point = firstPoint(rows);

    expect(point.dividends + point.interestOnEquity + point.distributions).toBe(
      point.total,
    );
    expect(point.total).toBe(totalOf(rows));
  });

  it("groups a year without losing the distribution", () => {
    const point = firstPoint(
      [
        row({ reference: "2026-08", kind: "DISTRIBUTION", amount: 351 }),
        row({ id: "2", reference: "2026-09", kind: "DISTRIBUTION", amount: 351 }),
      ],
      "YEAR",
    );

    expect(point.reference).toBe("2026");
    expect(point.distributions).toBe(702);
  });

  it("names every kind the API can send", () => {
    // Uma linha sem rótulo cai como célula vazia na tabela de proventos.
    expect(EARNING_KIND_LABELS.DISTRIBUTION).toBe("Rendimento");
    expect(Object.values(EARNING_KIND_LABELS).every(Boolean)).toBe(true);
  });
});
