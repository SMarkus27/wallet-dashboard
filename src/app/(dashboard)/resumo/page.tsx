import type { Metadata } from "next";

import { PendingTab } from "@/components/layout/pending-tab";

export const metadata: Metadata = { title: "Resumo" };

export default function ResumoPage() {
  return (
    <PendingTab
      title="Resumo"
      items={[
        "Evolução do patrimônio",
        "Porcentagem real por tipo de ativo",
        "Tabela por tipo de ativo com preço médio, saldo e percentual ideal",
      ]}
    />
  );
}
