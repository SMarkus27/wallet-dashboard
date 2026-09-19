import type { Metadata } from "next";

import { PendingTab } from "@/components/layout/pending-tab";

export const metadata: Metadata = { title: "Proventos" };

export default function ProventosPage() {
  return (
    <PendingTab
      title="Proventos"
      items={[
        "Histórico mensal com filtros de situação, ticker e tipo de ativo",
        "Evolução dos proventos recebidos por mês e por ano",
      ]}
    />
  );
}
