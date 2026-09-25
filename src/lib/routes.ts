import type { Route } from "next";

export const DASHBOARD_ROUTES = [
  { href: "/resumo", label: "Resumo" },
  { href: "/proventos", label: "Proventos" },
  { href: "/graficos", label: "Gráficos" },
  { href: "/rebalance", label: "Rebalance" },
  { href: "/irpf", label: "IRPF" },
  { href: "/carteiras", label: "Carteiras" },
] as const satisfies readonly { href: Route; label: string }[];

export type DashboardRoute = (typeof DASHBOARD_ROUTES)[number]["href"];

export const DEFAULT_ROUTE: DashboardRoute = "/resumo";

export function resolveRedirect(value: string | null): DashboardRoute {
  const match = DASHBOARD_ROUTES.find((route) => route.href === value);
  return match ? match.href : DEFAULT_ROUTE;
}
