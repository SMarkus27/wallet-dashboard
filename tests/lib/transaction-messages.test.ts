import { describe, expect, it } from "vitest";

import {
  TRANSACTION_MESSAGES,
  transactionMessage,
} from "@/lib/transactions/messages";

const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const UNPROCESSABLE = 422;

describe("transactionMessage", () => {
  it("tells apart the two 404 the API answers", () => {
    // Uma é "esse ativo não existe", a outra é "você não tem esse ativo".
    // O status é o mesmo; só o texto separa, e a diferença muda o que a
    // pessoa faz em seguida.
    expect(
      transactionMessage(
        NOT_FOUND,
        "There is no position for this asset in the wallet.",
      ),
    ).toBe(TRANSACTION_MESSAGES.noPosition);

    expect(
      transactionMessage(NOT_FOUND, "Asset not found. Check and try again later."),
    ).toBe(TRANSACTION_MESSAGES.assetNotFound);
  });

  it("names the quantity problem on an oversized sale", () => {
    expect(
      transactionMessage(
        BAD_REQUEST,
        "Insufficient position to sell the requested quantity.",
      ),
    ).toBe(TRANSACTION_MESSAGES.insufficient);
  });

  it("passes a validation detail through", () => {
    expect(
      transactionMessage(UNPROCESSABLE, "A data da negociação não pode estar no futuro."),
    ).toBe("A data da negociação não pode estar no futuro.");
  });

  it("falls back when nothing matches", () => {
    expect(transactionMessage(500, "")).toBe(TRANSACTION_MESSAGES.unexpected);
  });
});
