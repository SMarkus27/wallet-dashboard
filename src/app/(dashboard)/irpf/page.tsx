import type { Metadata } from "next";

import { IrpfView } from "@/components/irpf/irpf-view";
import { getTaxPeriods } from "@/lib/api/taxes";

export const metadata: Metadata = { title: "IRPF" };

export default async function IrpfPage() {
  const taxes = await getTaxPeriods();

  return <IrpfView taxes={taxes} />;
}
