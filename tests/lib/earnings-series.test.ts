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
  it("adds every kind into one bar", () => {
    // O gráfico responde "quanto entrou no mês". Três barras empilhadas
    // respondiam outra pergunta, que a tabela abaixo já responde por linha.
    const rows = [
      row({ kind: "DIVIDEND", amount: 100 }),
      row({ id: "2", kind: "JCP", amount: 50 }),
      row({ id: "3", kind: "DISTRIBUTION", ticker: "HGLG11", amount: 351 }),
    ];

    const point = firstPoint(rows);

    expect(point.total).toBe(501);
    expect(point.total).toBe(totalOf(rows));
  });

  it("groups a year without losing anything", () => {
    const point = firstPoint(
      [
        row({ reference: "2026-08", kind: "DISTRIBUTION", amount: 351 }),
        row({ id: "2", reference: "2026-09", kind: "JCP", amount: 149 }),
      ],
      "YEAR",
    );

    expect(point.reference).toBe("2026");
    expect(point.total).toBe(500);
  });

  it("keeps one bar per month", () => {
    const points = toSeries(
      [
        row({ reference: "2026-08", amount: 100 }),
        row({ id: "2", reference: "2026-09", amount: 200 }),
      ],
      "MONTH",
    );

    expect(points.map((point) => point.reference)).toEqual(["2026-08", "2026-09"]);
  });
});

describe("EARNING_KIND_LABELS", () => {
  it("still names every kind, because the table keeps the breakdown", () => {
    // A barra virou uma só; a linha da tabela continua dizendo se foi
    // dividendo, JCP ou rendimento.
    expect(EARNING_KIND_LABELS.DIVIDEND).toBe("Dividendo");
    expect(EARNING_KIND_LABELS.JCP).toBe("JCP");
    expect(EARNING_KIND_LABELS.DISTRIBUTION).toBe("Rendimento");
  });
});
