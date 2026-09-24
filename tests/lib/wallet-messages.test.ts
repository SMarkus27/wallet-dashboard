import { describe, expect, it } from "vitest";

import { WALLET_MESSAGES, walletMessage } from "@/lib/wallets/messages";

const CONFLICT = 409;
const NOT_FOUND = 404;
const UNPROCESSABLE = 422;

describe("walletMessage", () => {
  it("explains that a class has to exist before its sectors", () => {
    // A API responde 404 com essa frase quando se distribui setores de uma
    // classe sem meta. É a regra de domínio menos óbvia da tela.
    expect(
      walletMessage(
        NOT_FOUND,
        "Set the asset class allocation before distributing its sectors, "
          + "since a sector percentage is a share of its asset class.",
      ),
    ).toBe(WALLET_MESSAGES.missingAssetClass);
  });

  it("separates the three things the API spends 409 on", () => {
    expect(
      walletMessage(CONFLICT, "The total allocation percentage cannot exceed 100."),
    ).toBe(WALLET_MESSAGES.exceeded);

    expect(
      walletMessage(CONFLICT, "The same allocation cannot be sent more than once."),
    ).toBe(WALLET_MESSAGES.duplicate);

    expect(walletMessage(CONFLICT, "Something else entirely")).toBe(
      WALLET_MESSAGES.unexpected,
    );
  });

  it("passes a validation detail through untouched", () => {
    expect(walletMessage(UNPROCESSABLE, "O nome é obrigatório.")).toBe(
      "O nome é obrigatório.",
    );
  });

  it("falls back when the detail says nothing", () => {
    expect(walletMessage(500, "")).toBe(WALLET_MESSAGES.unexpected);
  });
});
