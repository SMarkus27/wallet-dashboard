"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckIcon, LoaderCircleIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, api } from "@/lib/api/client";
import type { PendingEarning, PortfolioPendingEarnings } from "@/lib/api/types";
import { formatCurrency, formatIsoDate, formatQuantity } from "@/lib/format";
import { EARNING_KIND_LABELS } from "@/lib/portfolio/earnings";
import {
  TRANSACTION_MESSAGES,
  transactionMessage,
} from "@/lib/transactions/messages";

export function PendingEarnings({ pending }: { pending: PortfolioPendingEarnings }) {
  const router = useRouter();

  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // A linha sai da lista assim que o lançamento é aceito. Esperar o
  // `router.refresh()` repintar deixaria o botão clicável de novo por alguns
  // instantes, e um segundo clique criaria o mesmo provento duas vezes.
  const waiting = pending.payments.filter(
    (payment) => !confirmed.has(payment.external_id_str),
  );

  if (waiting.length === 0) return null;

  async function confirm(payment: PendingEarning) {
    setConfirming(payment.external_id_str);
    setError(null);

    try {
      // O servidor monta o lançamento a partir do anúncio. Mandar valores
      // daqui abriria espaço para registrar o líquido no lugar do bruto.
      await api.post(
        `/investor/portfolio/earnings/${payment.external_id_str}/confirm`,
        {},
      );

      setConfirmed((done) => new Set(done).add(payment.external_id_str));
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? transactionMessage(cause.status, cause.message)
          : TRANSACTION_MESSAGES.unavailable,
      );
    } finally {
      setConfirming(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>A confirmar</CardTitle>
        <CardDescription>
          Proventos cuja data de pagamento já passou e que ainda não estão
          lançados. O valor é o bruto anunciado: a retenção do JCP é calculada
          na apuração, então não desconte nada aqui.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Valor bruto</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {waiting.map((payment) => (
              <TableRow key={payment.external_id_str}>
                <TableCell className="font-medium">{payment.ticker}</TableCell>
                <TableCell className="text-muted-foreground">
                  {EARNING_KIND_LABELS[payment.type]}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {formatIsoDate(payment.payment_date)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatQuantity(payment.quantity)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={confirming !== null}
                    onClick={() => confirm(payment)}
                    aria-label={`Confirmar recebimento de ${payment.ticker}`}
                  >
                    {confirming === payment.external_id_str ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      <CheckIcon />
                    )}
                    Confirmar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="text-sm text-muted-foreground">
          Total a confirmar:{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {formatCurrency(pending.total)}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
