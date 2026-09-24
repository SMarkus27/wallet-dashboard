import "server-only";

import { apiGet } from "@/lib/api/server";
import type { WalletList } from "@/lib/api/types";

export function getWallets() {
  return apiGet<WalletList>("/investor/wallets/");
}
