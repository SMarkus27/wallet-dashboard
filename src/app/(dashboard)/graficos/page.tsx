import type { Metadata } from "next";

import { AllocationSharesCard } from "@/components/graficos/allocation-shares-card";
import { EquityHistoryCard } from "@/components/graficos/equity-history-card";
import { getAllocation, getEquityHistory } from "@/lib/api/portfolio";

export const metadata: Metadata = { title: "Gráficos" };

export default async function GraficosPage() {
  const [allocation, history] = await Promise.all([
    getAllocation(),
    getEquityHistory(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <EquityHistoryCard allocation={allocation} initialHistory={history} />
      <AllocationSharesCard allocation={allocation} />
    </div>
  );
}
