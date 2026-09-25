import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RebalanceView } from "@/components/rebalance/rebalance-view";
import type { PortfolioRebalance } from "@/lib/api/types";

const get = vi.fn();

vi.mock("@/lib/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/client")>(
    "@/lib/api/client",
  );

  return { ...actual, api: { get: (...args: unknown[]) => get(...args) } };
});

function rebalance(overrides: Partial<PortfolioRebalance> = {}): PortfolioRebalance {
  return {
    reference: "2026-09-25T10:00:00",
    amount: "5000",
    asset_type: null,
    total_equity: "10000",
    projected_equity: "15000",
    allocated_amount: "4800",
    leftover_amount: "200",
    asset_types: [],
    sectors: [],
    assets: [
      {
        external_id_str: "a-1",
        ticker: "HGLG11",
        name: "CSHG Logística",
        asset_type: "FII",
        sector: "Logística",
        price: "160",
        quantity: 30,
        amount: "4800",
        current_value: "1000",
        projected_value: "5800",
        projected_percentage: "38.67",
      },
    ],
    missing_targets: [],
    ...overrides,
  };
}

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue(rebalance());
});

describe("RebalanceView", () => {
  it("asks nothing until an amount worth calculating is typed", async () => {
    // A rota exige `amount > 0`. Disparar a cada tecla mandaria "5", "50",
    // "500" e um 422 para o campo vazio.
    const user = userEvent.setup();
    render(<RebalanceView />);

    expect(get).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/quanto você vai aportar/i), "0");

    await waitFor(() => expect(get).not.toHaveBeenCalled());
  });

  it("shows what to buy once the amount is valid", async () => {
    const user = userEvent.setup();
    render(<RebalanceView />);

    await user.type(screen.getByLabelText(/quanto você vai aportar/i), "5000");

    expect(await screen.findByText("HGLG11")).toBeInTheDocument();
    expect(screen.getByText(/30/)).toBeInTheDocument();
  });

  it("sends the amount and leaves the class out when it is not chosen", async () => {
    const user = userEvent.setup();
    render(<RebalanceView />);

    await user.type(screen.getByLabelText(/quanto você vai aportar/i), "5000");

    await waitFor(() => expect(get).toHaveBeenCalled());

    const [path, params] = get.mock.calls.at(-1) as [string, Record<string, unknown>];

    expect(path).toBe("/investor/portfolio/rebalance");
    expect(params.amount).toBe(5000);
    expect(params.asset_type).toBeUndefined();
  });

  it("says plainly that nothing is recorded", () => {
    // A sugestão não cria transação. Sem isso escrito, a tela parece um
    // botão de comprar.
    render(<RebalanceView />);

    expect(screen.getByText(/não cria transação/i)).toBeInTheDocument();
  });

  it("warns about a target with no asset to buy", async () => {
    get.mockResolvedValue(
      rebalance({
        missing_targets: [
          {
            dimension: "SECTOR",
            name: "LOGISTICS",
            label: "Logística",
            asset_type: "FII",
            target_percentage: "10",
          },
        ],
      }),
    );

    const user = userEvent.setup();
    render(<RebalanceView />);

    await user.type(screen.getByLabelText(/quanto você vai aportar/i), "5000");

    expect(await screen.findByText(/metas sem ativo em carteira/i)).toBeInTheDocument();
  });
});
