import { describe, expect, it } from "vitest";

import { sameOriginRedirect } from "@/lib/api/upstream";

const API = "https://wallet-five-teal.vercel.app/api/v1/investor/wallets";

describe("sameOriginRedirect", () => {
  it("follows the slash the API adds to a collection route", () => {
    // Criar carteira nunca chegou na API: o Next remove a barra final antes
    // do handler e o FastAPI devolve 307 pedindo ela de volta. Seguir esse
    // redirecionamento é o conserto inteiro.
    expect(sameOriginRedirect(API, `${API}/`)).toBe(`${API}/`);
  });

  it("resolves a relative location against the request", () => {
    expect(sameOriginRedirect(API, "/api/v1/investor/wallets/")).toBe(
      "https://wallet-five-teal.vercel.app/api/v1/investor/wallets/",
    );
  });

  it("refuses another origin", () => {
    // O `redirect: "manual"` existe para o cookie de sessão não ser levado
    // para outro host. Seguir um redirecionamento cruzado desfaria isso.
    expect(sameOriginRedirect(API, "https://attacker.example.com/steal")).toBe(
      null,
    );
  });

  it("refuses another origin disguised as a protocol change", () => {
    expect(sameOriginRedirect(API, "http://wallet-five-teal.vercel.app/x")).toBe(
      null,
    );
  });

  it("returns null when there is no location", () => {
    expect(sameOriginRedirect(API, null)).toBe(null);
  });
});
