import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SectorTargets } from "@/components/wallets/sector-targets";
import type { WalletAssetClassTarget, WalletSectorTarget } from "@/lib/api/types";
import { WALLET_MESSAGES } from "@/lib/wallets/messages";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
}));

const STOCKS: WalletAssetClassTarget = {
  external_id: "11111111-1111-1111-1111-111111111111",
  name: "AÇÃO",
  percentage: 30,
};

const BANKS: WalletSectorTarget = {
  external_id: "22222222-2222-2222-2222-222222222222",
  asset_type: "AÇÃO",
  sector: "Bancos",
  percentage: 40,
};

describe("SectorTargets", () => {
  it("states the domain rule when no class is allocated", () => {
    // Distribuir setores sem meta de classe responde 404 na API. Mostrar a
    // regra no lugar do formulário evita que ela seja descoberta pelo erro.
    render(<SectorTargets sectors={[]} assetClasses={[]} />);

    expect(screen.getByText(WALLET_MESSAGES.missingAssetClass)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar setores/i })).toBeNull();
  });

  it("opens on the chart and keeps the editor behind a button", async () => {
    const user = userEvent.setup();

    render(<SectorTargets sectors={[BANKS]} assetClasses={[STOCKS]} />);

    expect(screen.queryByRole("table")).toBeNull();

    await user.click(screen.getByRole("button", { name: /editar setores/i }));

    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("shows a sector as its share of the wallet, not of its class", () => {
    // 40% dentro de uma classe que ocupa 30% da carteira são 12% da carteira.
    // Sem essa conta as fatias de classes diferentes não seriam comparáveis.
    render(<SectorTargets sectors={[BANKS]} assetClasses={[STOCKS]} />);

    // Aparece duas vezes: no centro do donut e na legenda.
    expect(screen.getAllByText("12,00%").length).toBeGreaterThan(0);
    expect(screen.queryByText("40,00%")).toBeNull();
  });
});
