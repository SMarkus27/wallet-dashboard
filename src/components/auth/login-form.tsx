"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircleIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api/client";
import {
  AUTH_MESSAGES,
  challengeExpired,
  mfaMessage,
  signinMessage,
} from "@/lib/auth/messages";
import { resolveRedirect } from "@/lib/routes";

type SigninResult = { mfa_signin_token?: string; authenticated?: boolean };

const CODE_LENGTH = 6;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [challenge, setChallenge] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const destination = resolveRedirect(searchParams.get("next"));

  function enter() {
    router.replace(destination);
    router.refresh();
  }

  function fail(message: string) {
    setError(message);
    setPending(false);
  }

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const result = await api.post<SigninResult>("/investor/auth/signin", {
        username,
        password,
      });

      if (result?.mfa_signin_token) {
        setChallenge(result.mfa_signin_token);
        setCode("");
        setPending(false);
        return;
      }

      enter();
    } catch (cause) {
      if (!(cause instanceof ApiError)) return fail(AUTH_MESSAGES.unavailable);
      fail(signinMessage(cause.status));
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await api.post("/investor/auth/signin/mfa", {
        mfa_signin_token: challenge,
        code,
      });

      enter();
    } catch (cause) {
      if (!(cause instanceof ApiError)) return fail(AUTH_MESSAGES.unavailable);

      if (challengeExpired(cause.status, cause.message)) {
        setChallenge(null);
        setPassword("");
      }

      fail(mfaMessage(cause.status, cause.message));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">
          {challenge ? "Confirme o acesso" : "Entrar na carteira"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {challenge
            ? `Digite o código de ${CODE_LENGTH} dígitos do seu aplicativo autenticador.`
            : "Acompanhe patrimônio, proventos e apuração de IRPF."}
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {challenge ? (
        <form onSubmit={submitCode} className="flex flex-col gap-4" noValidate>
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

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setChallenge(null);
              setError(null);
              setPassword("");
            }}
          >
            Usar outra conta
          </Button>
        </form>
      ) : (
        <form onSubmit={submitCredentials} className="flex flex-col gap-4" noValidate>
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <Button type="submit" disabled={pending || !username || !password}>
            {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
            Entrar
          </Button>
        </form>
      )}
    </div>
  );
}
