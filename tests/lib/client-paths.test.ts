import { describe, expect, it } from "vitest";

const SOURCES = import.meta.glob("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const CALL = /\bapi\.(?:get|post|patch|put|delete)\b[^(]*\(\s*"([^"]+)"/g;

function clientCalls() {
  return Object.entries(SOURCES).flatMap(([file, source]) =>
    [...source.matchAll(CALL)].map((match) => ({ file, path: match[1] ?? "" })),
  );
}

describe("paths passed to the api client", () => {
  it("never end in a slash", () => {
    // Uma barra final faz o Next responder 308 e normalizar antes do proxy,
    // acrescentando um redirecionamento no navegador — num POST que cria
    // registro financeiro. Sem ela o proxy resolve direto, e o 307 que a API
    // devolve nas rotas dela terminadas em barra é seguido no servidor.
    const offenders = clientCalls().filter(
      (call) => call.path.length > 1 && call.path.endsWith("/"),
    );

    expect(offenders).toEqual([]);
  });

  it("finds the calls it is meant to guard", () => {
    // Se a expressão parar de casar, o teste acima passa vazio para sempre.
    expect(clientCalls().length).toBeGreaterThan(5);
  });
});
