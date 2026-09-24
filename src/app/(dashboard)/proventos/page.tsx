import type { Metadata } from "next";

import { EarningsView } from "@/components/earnings/earnings-view";
import { getEarnings, getScheduledEarnings } from "@/lib/api/portfolio";

export const metadata: Metadata = { title: "Proventos" };

export default async function ProventosPage() {
  const [received, scheduled] = await Promise.all([
    getEarnings(),
    getScheduledEarnings(),
  ]);

  return <EarningsView received={received} scheduled={scheduled} />;
}
