"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircleIcon, TriangleAlertIcon } from "lucide-react";

import { MfaStep } from "@/components/auth/mfa-step";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api/client";
import { AUTH_MESSAGES, signinMessage } from "@/lib/auth/messages";
import { resolveRedirect } from "@/lib/routes";

type SigninResult = { mfa_signin_token?: string; authenticated?: boolean };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [challenge, setChallenge] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const destination = resolveRedirect(searchParams.get("next"));

  function enter() {
    router.replace(destination);
    router.refresh();
  }

  function backToCredentials() {
    setChallenge(null);
    setError(null);
    setPassword("");
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
        setPending(false);
        return;
      }

      enter();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? signinMessage(cause.status)
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
        onExpired={backToCredentials}
        onBack={backToCredentials}
        backLabel="Usar outra conta"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Entrar na carteira</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe patrimônio, proventos e apuração de IRPF.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

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

        <Button variant="ghost" size="sm" asChild>
          <Link href="/forgot-password">Esqueci minha senha</Link>
        </Button>
      </form>
    </div>
  );
}
