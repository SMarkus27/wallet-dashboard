"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircleIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api/client";
import { WALLET_MESSAGES, walletMessage } from "@/lib/wallets/messages";

export function WalletCreateForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError(WALLET_MESSAGES.emptyName);
      return;
    }

    setPending(true);
    setError(null);

    try {
      await api.post("/investor/wallets", { name: name.trim() });
      setName("");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? walletMessage(cause.status, cause.message)
          : WALLET_MESSAGES.unavailable,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {error ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="wallet-name">Nome da carteira</Label>
          <Input
            id="wallet-name"
            name="name"
            maxLength={255}
            placeholder="Previdência, Reserva, Carteira principal"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          Criar carteira
        </Button>
      </div>
    </form>
  );
}
