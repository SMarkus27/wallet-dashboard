"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CheckIcon, LoaderCircleIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api/client";
import { AUTH_MESSAGES, recoveryMessage } from "@/lib/auth/messages";

export function ForgotPasswordForm() {
  const [username, setUsername] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await api.post("/investor/auth/recovery/request", { username });
      setSent(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? recoveryMessage(cause.status)
          : AUTH_MESSAGES.unavailable,
      );
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">Verifique o e-mail</h1>
          <p className="text-sm text-muted-foreground">
            {AUTH_MESSAGES.recoverySent}
          </p>
        </div>

        <Alert>
          <CheckIcon />
          <AlertDescription className="text-muted-foreground">
            Não chegou? Confira a caixa de spam ou peça outro link.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => setSent(false)}>
            Enviar de novo
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Voltar para o login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Recuperar acesso</h1>
        <p className="text-sm text-muted-foreground">
          Informe o e-mail da conta e enviaremos um link para redefinir a senha.
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
          <Label htmlFor="username">E-mail</Label>
          <Input
            id="username"
            name="username"
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <Button type="submit" disabled={pending || !username}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          Enviar link
        </Button>

        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Voltar para o login</Link>
        </Button>
      </form>
    </div>
  );
}
