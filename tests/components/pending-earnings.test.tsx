import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PendingEarnings } from "@/components/earnings/pending-earnings";
import type { PendingEarning, PortfolioPendingEarnings } from "@/lib/api/types";

const post = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/client")>(
    "@/lib/api/client",
  );

  return { ...actual, api: { post: (...args: unknown[]) => post(...args) } };
});

function earning(overrides: Partial<PendingEarning> = {}): PendingEarning {
  return {
    external_id_str: "ann-1",
    asset_external_id: "asset-1",
    ticker: "ITUB4",
    name: "Itau Unibanco",
    asset_type: "AÇÃO",
    sector: "BANKS",
    sector_label: "Bancos",
    type: "JCP",
    quantity: 100,
    price: "0.01818200",
    amount: "1.82",
    ex_date: "2026-08-31T00:00:00",
    payment_date: "2026-10-01T00:00:00",
    ...overrides,
  };
}

function pending(
  overrides: Partial<PortfolioPendingEarnings> = {},
): PortfolioPendingEarnings {
  return {
    reference: "2026-10-02T10:00:00",
    total: "1.82",
    payments: [earning()],
    ...overrides,
  };
}

beforeEach(() => {
  post.mockReset();
  refresh.mockReset();
  post.mockResolvedValue({});
});

describe("PendingEarnings", () => {
  it("stays out of the way when nothing is waiting", () => {
    const { container } = render(
      <PendingEarnings pending={pending({ payments: [], total: "0.00" })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("asks the server to confirm the announcement, sending no values", async () => {
    // Quantidade, preço e data saem do anúncio no servidor. Se a tela
    // mandasse valores, daria para registrar o líquido no lugar do bruto e a
    // retenção do JCP seria aplicada duas vezes.
    const user = userEvent.setup();
    render(<PendingEarnings pending={pending()} />);

    await user.click(screen.getByRole("button", { name: /confirmar recebimento/i }));

    await waitFor(() => expect(post).toHaveBeenCalled());

    const [path, body] = post.mock.calls[0] as [string, Record<string, unknown>];

    expect(path).toBe("/investor/portfolio/earnings/ann-1/confirm");
    expect(body).toEqual({});
  });

  it("refreshes the page so the row leaves the list", async () => {
    const user = userEvent.setup();
    render(<PendingEarnings pending={pending()} />);

    await user.click(screen.getByRole("button", { name: /confirmar recebimento/i }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("says what went wrong instead of failing quietly", async () => {
    post.mockRejectedValue(new Error("boom"));

    const user = userEvent.setup();
    render(<PendingEarnings pending={pending()} />);

    await user.click(screen.getByRole("button", { name: /confirmar recebimento/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("blocks a second click while the first is in flight", async () => {
    // Dois cliques criariam dois lançamentos do mesmo provento.
    post.mockImplementation(() => new Promise(() => {}));

    const user = userEvent.setup();
    render(
      <PendingEarnings
        pending={pending({
          payments: [earning(), earning({ external_id_str: "ann-2", ticker: "PETR4" })],
        })}
      />,
    );

    const [first, second] = screen.getAllByRole("button", { name: /confirmar/i });

    await user.click(first!);

    expect(second).toBeDisabled();
    expect(post).toHaveBeenCalledTimes(1);
  });
});

describe("PendingEarnings, after the server accepted the entry", () => {
  it("takes the row off the list instead of waiting for the refresh", async () => {
    // Aconteceu em produção: a trava só valia durante a requisição, e o
    // `router.refresh()` demora a repintar. Dois cliques na mesma linha
    // criaram o mesmo JCP da PETR4 duas vezes.
    const user = userEvent.setup();
    render(<PendingEarnings pending={pending()} />);

    const button = screen.getByRole("button", { name: /confirmar recebimento/i });

    await user.click(button);

    await waitFor(() => expect(screen.queryByText("ITUB4")).toBeNull());
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("hides the whole card once the last row is confirmed", async () => {
    const user = userEvent.setup();
    const { container } = render(<PendingEarnings pending={pending()} />);

    await user.click(screen.getByRole("button", { name: /confirmar recebimento/i }));

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("keeps the row when the server refused it", async () => {
    post.mockRejectedValue(new Error("boom"));

    const user = userEvent.setup();
    render(<PendingEarnings pending={pending()} />);

    await user.click(screen.getByRole("button", { name: /confirmar recebimento/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("ITUB4")).toBeInTheDocument();
  });
});
