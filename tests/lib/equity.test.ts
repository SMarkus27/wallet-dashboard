import { describe, expect, it } from "vitest";

import type { EquityPoint } from "@/lib/api/types";
import { hasLoss, toEquityBars } from "@/lib/portfolio/equity";

function month(overrides: Partial<EquityPoint> = {}): EquityPoint {
  return {
    reference: "2026-09",
    year: 2026,
    month: 9,
    total_equity: "14330.74",
    invested_amount: "13270.00",
    capital_gain: "1060.74",
    realized_gain: "0.00",
    earnings: "0.00",
    ...overrides,
  };
}

describe("toEquityBars", () => {
  it("stacks the gain on top of what was invested", () => {
    const [bar] = toEquityBars([month()]);

    expect(bar?.base).toBe(13270);
    expect(bar?.surplus).toBeCloseTo(1060.74);
    expect(bar?.shortfall).toBe(0);
  });

  it("closes the stack exactly at the equity when there is a gain", () => {
    // É o que faz a altura da barra significar patrimônio.
    const [bar] = toEquityBars([month()]);

    expect((bar?.base ?? 0) + (bar?.surplus ?? 0)).toBeCloseTo(bar?.equity ?? 0);
  });

  it("puts the loss above the equity instead of below the axis", () => {
    // Empilhar um ganho negativo desenharia o segmento para baixo do eixo.
    // Com prejuízo a barra sólida é o patrimônio e o topo mostra o que
    // falta para voltar ao valor aplicado.
    const [bar] = toEquityBars([
      month({
        total_equity: "42.04",
        invested_amount: "45.00",
        capital_gain: "-2.96",
      }),
    ]);

    expect(bar?.base).toBe(42.04);
    expect(bar?.surplus).toBe(0);
    expect(bar?.shortfall).toBeCloseTo(2.96);
    expect((bar?.base ?? 0) + (bar?.shortfall ?? 0)).toBeCloseTo(45);
  });

  it("never produces a negative segment", () => {
    const bars = toEquityBars([
      month(),
      month({ total_equity: "42.04", invested_amount: "45.00", capital_gain: "-2.96" }),
      month({ total_equity: "0", invested_amount: "0", capital_gain: "0" }),
    ]);

    for (const bar of bars) {
      expect(bar.base).toBeGreaterThanOrEqual(0);
      expect(bar.surplus).toBeGreaterThanOrEqual(0);
      expect(bar.shortfall).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("hasLoss", () => {
  it("is false while every month is above what was invested", () => {
    expect(hasLoss(toEquityBars([month(), month()]))).toBe(false);
  });

  it("is true as soon as one month sits below it", () => {
    // A legenda só ganha a terceira entrada quando existe perda para mostrar.
    const bars = toEquityBars([
      month(),
      month({ total_equity: "42.04", invested_amount: "45.00" }),
    ]);

    expect(hasLoss(bars)).toBe(true);
  });
});
