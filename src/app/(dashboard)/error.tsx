"use client";

import { useEffect } from "react";
import { TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Alert variant="destructive" className="flex flex-col gap-3">
      <TriangleAlertIcon />
      <div>
        <AlertTitle>Não foi possível carregar os dados</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          A API do Wallet não respondeu como esperado. Tente novamente em
          instantes.
        </AlertDescription>
      </div>
      <Button variant="outline" size="sm" className="self-start" onClick={reset}>
        Tentar de novo
      </Button>
    </Alert>
  );
}
