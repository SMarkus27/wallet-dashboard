import type { EquityPoint } from "@/lib/api/types";
import { toNumber } from "@/lib/format";

export type EquityBar = {
  reference: string;
  invested: number;
  equity: number;
  gain: number;
  earnings: number;
  base: number;
  surplus: number;
  shortfall: number;
};

export function toEquityBars(months: EquityPoint[]): EquityBar[] {
  return months.map((month) => {
    const invested = toNumber(month.invested_amount);
    const equity = toNumber(month.total_equity);

    // A pilha fecha na altura do maior dos dois. Com ganho, o topo claro é o
    // que passou do aplicado; com prejuízo, o topo vermelho é o que falta
    // para voltar a ele. Empilhar o ganho negativo direto mandaria o
    // segmento para baixo do eixo e a barra deixaria de significar nada.
    return {
      reference: month.reference,
      invested,
      equity,
      gain: toNumber(month.capital_gain),
      earnings: toNumber(month.earnings),
      base: Math.min(invested, equity),
      surplus: Math.max(equity - invested, 0),
      shortfall: Math.max(invested - equity, 0),
    };
  });
}

export function hasLoss(bars: EquityBar[]) {
  return bars.some((bar) => bar.shortfall > 0);
}
