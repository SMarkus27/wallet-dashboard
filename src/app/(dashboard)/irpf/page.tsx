import type { Metadata } from "next";

import { PendingTab } from "@/components/layout/pending-tab";

export const metadata: Metadata = { title: "IRPF" };

export default function IrpfPage() {
  return (
    <PendingTab
      title="IRPF"
      items={["Apuração mensal por classe de ativo", "DARF do mês e situação"]}
    />
  );
}
