import type { Metadata } from "next";

import { PendingTab } from "@/components/layout/pending-tab";

export const metadata: Metadata = { title: "Gráficos" };

export default function GraficosPage() {
  return (
    <PendingTab
      title="Gráficos"
      items={[
        "Patrimônio separando valor aplicado de ganho de capital",
        "Porcentagem real por setor",
        "Porcentagem real por ativo",
      ]}
    />
  );
}
