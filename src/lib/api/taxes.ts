import "server-only";

import { apiGet } from "@/lib/api/server";
import type { AssetType, TaxPeriodList } from "@/lib/api/types";

export function getTaxPeriods(
  options: { year?: number; month?: number; assetType?: AssetType } = {},
) {
  return apiGet<TaxPeriodList>("/investor/taxes/periods", {
    year: options.year,
    month: options.month,
    asset_type: options.assetType,
  });
}
