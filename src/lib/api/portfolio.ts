import "server-only";

import { apiGet } from "@/lib/api/server";
import type {
  AssetType,
  PortfolioAllocation,
  PortfolioEarnings,
  PortfolioEquity,
  PortfolioEquityHistory,
  PortfolioOverview,
  PortfolioPeriod,
} from "@/lib/api/types";

export function getOverview() {
  return apiGet<PortfolioOverview>("/investor/portfolio/overview");
}

export function getAllocation() {
  return apiGet<PortfolioAllocation>("/investor/portfolio/allocation");
}

export function getEquity(period?: PortfolioPeriod) {
  return apiGet<PortfolioEquity>("/investor/portfolio/equity", { period });
}

export function getEquityHistory(options: {
  period?: PortfolioPeriod;
  assetType?: AssetType;
} = {}) {
  return apiGet<PortfolioEquityHistory>("/investor/portfolio/equity/history", {
    period: options.period,
    asset_type: options.assetType,
  });
}

export function getEarnings(period?: PortfolioPeriod) {
  return apiGet<PortfolioEarnings>("/investor/portfolio/earnings", { period });
}
