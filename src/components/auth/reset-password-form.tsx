"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircleIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MfaStep } from "@/components/auth/mfa-step";
import { ApiError, api } from "@/lib/api/client";
import { AUTH_MESSAGES, resetMessage } from "@/lib/auth/messages";
import { DEFAULT_ROUTE } from "@/lib/routes";

const RULES = [
  "Ao menos 8 caracteres",
  "Misture minúsculas, maiúsculas, números e símbolos — ou use uma frase de 16 caracteres ou mais",
  "Nada de senhas óbvias, como sequências ou palavras comuns",
];

type ResetResult = { mfa_signin_token?: string; authenticated?: boolean };

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const [challenge, setChallenge] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function enter() {
    router.replace(DEFAULT_ROUTE);
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmation) {
      setError(AUTH_MESSAGES.passwordMismatch);
      return;
    }

    setPending(true);
    setError(null);

    try {
      const result = await api.put<ResetResult>(
        "/investor/auth/recovery/reset",
        {
          token,
          new_password: password,
          new_password_confirm: confirmation,
        },
      );

      // Conta com segundo fator não entra só com a senha nova: o reset
      // devolve o desafio, e é a confirmação do código que cria a sessão.
      if (result?.mfa_signin_token) {
        setChallenge(result.mfa_signin_token);
        setPending(false);
        return;
      }

      enter();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? resetMessage(cause.status, cause.message)
          : AUTH_MESSAGES.unavailable,
      );
      setPending(false);
    }
  }

  if (challenge) {
    return (
      <MfaStep
        challenge={challenge}
        onAuthenticated={enter}
        onExpired={() => setChallenge(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Definir nova senha</h1>
        <p className="text-sm text-muted-foreground">
          Ao confirmar, você entra direto na carteira.
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
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmation">Repita a nova senha</Label>
          <Input
            id="confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>

        <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
          {RULES.map((rule) => (
            <li key={rule} className="flex gap-2">
              <span aria-hidden className="text-subtle-foreground">
                —
              </span>
              {rule}
            </li>
          ))}
        </ul>

        <Button type="submit" disabled={pending || !password || !confirmation}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          Redefinir e entrar
        </Button>
      </form>
    </div>
  );
}
