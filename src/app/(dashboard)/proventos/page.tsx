import type { Metadata } from "next";

import { EarningsView } from "@/components/earnings/earnings-view";
import { PendingEarnings } from "@/components/earnings/pending-earnings";
import {
  getEarnings,
  getPendingEarnings,
  getScheduledEarnings,
} from "@/lib/api/portfolio";

export const metadata: Metadata = { title: "Proventos" };

export default async function ProventosPage() {
  const [received, scheduled, pending] = await Promise.all([
    getEarnings(),
    getScheduledEarnings(),
    getPendingEarnings(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PendingEarnings pending={pending} />
      <EarningsView received={received} scheduled={scheduled} />
    </div>
  );
}
