"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api/client";
import type { TaxPeriod } from "@/lib/api/types";

const NEXT_STATUS = { PAGO: "PENDING", PENDENTE: "PAID" } as const;

export function DarfAction({
  period,
  onError,
}: {
  period: TaxPeriod;
  onError: (message: string | null) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const target =
    period.status === "PAGO" || period.status === "PENDENTE"
      ? NEXT_STATUS[period.status]
      : null;

  if (target === null) return null;

  async function toggle() {
    setPending(true);
    onError(null);

    try {
      await api.patch(`/investor/taxes/periods/${period.external_id_str}`, {
        status: target,
      });
      router.refresh();
    } catch (cause) {
      onError(
        cause instanceof ApiError
          ? cause.message
          : "Não foi possível atualizar a situação da DARF.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={pending}>
      {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
      {target === "PAID" ? "Marcar como paga" : "Marcar como pendente"}
    </Button>
  );
}
