import { describe, expect, it } from "vitest";

import { DASHBOARD_ROUTES, DEFAULT_ROUTE, resolveRedirect } from "@/lib/routes";

describe("resolveRedirect", () => {
  it("accepts every route the navigation offers", () => {
    for (const route of DASHBOARD_ROUTES) {
      expect(resolveRedirect(route.href)).toBe(route.href);
    }
  });

  it("refuses anything outside the dashboard", () => {
    // O valor vem do parâmetro `next` da URL de login, ou seja, de fora.
    // Devolver o default é o que impede um redirecionamento arbitrário.
    expect(resolveRedirect("https://attacker.example.com")).toBe(DEFAULT_ROUTE);
    expect(resolveRedirect("/api/wallet/investor/auth/logout")).toBe(DEFAULT_ROUTE);
    expect(resolveRedirect(null)).toBe(DEFAULT_ROUTE);
  });
});
