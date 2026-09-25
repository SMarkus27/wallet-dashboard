import type { Metadata } from "next";

import { RebalanceView } from "@/components/rebalance/rebalance-view";

export const metadata: Metadata = { title: "Rebalance" };

export default function RebalancePage() {
  return <RebalanceView />;
}
