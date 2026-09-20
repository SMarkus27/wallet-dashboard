"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircleIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api/client";
import { AUTH_MESSAGES, challengeExpired, mfaMessage } from "@/lib/auth/messages";

export const CODE_LENGTH = 6;

export function MfaStep({
  challenge,
  onAuthenticated,
  onExpired,
  onBack,
  backLabel,
}: {
  challenge: string;
  onAuthenticated: () => void;
  onExpired: () => void;
  onBack?: () => void;
  backLabel?: string;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await api.post("/investor/auth/signin/mfa", {
        mfa_signin_token: challenge,
        code,
      });

      onAuthenticated();
    } catch (cause) {
      if (!(cause instanceof ApiError)) {
        setError(AUTH_MESSAGES.unavailable);
        setPending(false);
        return;
      }

      if (challengeExpired(cause.status, cause.message)) onExpired();

      setError(mfaMessage(cause.status, cause.message));
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Confirme o acesso</h1>
        <p className="text-sm text-muted-foreground">
          Digite o código de {CODE_LENGTH} dígitos do seu aplicativo autenticador.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">Código de verificação</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={CODE_LENGTH}
            required
            autoFocus
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
            }
            className="text-center text-lg tracking-[0.5em]"
          />
        </div>

        <Button type="submit" disabled={pending || code.length < CODE_LENGTH}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          Confirmar
        </Button>

        {onBack ? (
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            {backLabel ?? "Voltar"}
          </Button>
        ) : null}
      </form>
    </div>
  );
}
