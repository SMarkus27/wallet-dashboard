import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
}));

const post = vi.fn();

vi.mock("@/lib/api/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/client")>(
    "@/lib/api/client",
  );

  return {
    ...actual,
    api: { get: vi.fn().mockResolvedValue({ items: [] }), post: (...args: unknown[]) => post(...args) },
  };
});

async function open() {
  const user = userEvent.setup();
  render(<AddTransactionDialog />);
  await user.click(screen.getByRole("button", { name: /adicionar transação/i }));
  return user;
}

describe("AddTransactionDialog", () => {
  it("stays closed until the button is pressed", () => {
    render(<AddTransactionDialog />);

    expect(screen.queryByLabelText(/quantidade/i)).toBeNull();
  });

  it("adds the costs on a purchase and subtracts them on a sale", async () => {
    // Comprar 10 a 5,00 com 2,00 de custo custa 52,00; vender os mesmos 10
    // entrega 48,00. O mesmo campo de custo entra com sinal contrário, que é
    // a parte fácil de errar.
    const user = await open();

    await user.clear(screen.getByLabelText(/quantidade/i));
    await user.type(screen.getByLabelText(/quantidade/i), "10");
    await user.type(screen.getByLabelText(/preço em r\$/i), "5");
    await user.clear(screen.getByLabelText(/outros custos/i));
    await user.type(screen.getByLabelText(/outros custos/i), "2");

    expect(screen.getByText("Valor total")).toBeInTheDocument();
    expect(screen.getByText(/52,00/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /venda/i }));

    expect(screen.getByText("Valor líquido")).toBeInTheDocument();
    expect(screen.getByText(/48,00/)).toBeInTheDocument();
  });

  it("keeps saving out of reach until an asset is chosen", async () => {
    // A guarda que vale é o botão desabilitado: o `if (!asset)` dentro do
    // submit existe para o TypeScript, e a interface nunca chega nele.
    const user = await open();

    expect(screen.getByRole("button", { name: /^salvar$/i })).toBeDisabled();

    await user.type(screen.getByLabelText(/preço em r\$/i), "5");

    expect(screen.getByRole("button", { name: /^salvar$/i })).toBeDisabled();
    expect(post).not.toHaveBeenCalled();
  });

  it("caps the date at today, so the API never sees a future trade", async () => {
    await open();

    const today = new Date().toISOString().slice(0, 10);

    expect(screen.getByLabelText(/data/i)).toHaveAttribute("max", today);
    expect(screen.getByLabelText(/data/i)).toHaveValue(today);
  });
});
