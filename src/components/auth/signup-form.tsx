"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CheckIcon, LoaderCircleIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api/client";
import {
  AUTH_MESSAGES,
  confirmSignupMessage,
  signupMessage,
} from "@/lib/auth/messages";
import { DEFAULT_ROUTE } from "@/lib/routes";

const CODE_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 8;

type ConfirmResult = { authenticated?: boolean };

export function SignupForm() {
  const router = useRouter();

  const [awaitingCode, setAwaitingCode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function enter() {
    router.replace(DEFAULT_ROUTE);
    router.refresh();
  }

  function backToDetails() {
    setAwaitingCode(false);
    setCode("");
    setNotice(null);
    setError(null);
  }

  async function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== passwordConfirm) {
      setError(AUTH_MESSAGES.passwordMismatch);
      return;
    }

    setPending(true);
    setError(null);

    try {
      await api.post("/investor/auth/signup/request", {
        name,
        email,
        password,
        passwordConfirm,
      });

      setAwaitingCode(true);
      setNotice(AUTH_MESSAGES.signupCodeSent);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? signupMessage(cause.status, cause.message)
          : AUTH_MESSAGES.unavailable,
      );
    } finally {
      setPending(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      const result = await api.post<ConfirmResult>(
        "/investor/auth/signup/confirm",
        { verification_code: code, email },
      );

      if (result?.authenticated) {
        enter();
        return;
      }

      setCode("");
      setNotice(AUTH_MESSAGES.signupCodeResent);
      setPending(false);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? confirmSignupMessage(cause.status, cause.message)
          : AUTH_MESSAGES.unavailable,
      );
      setPending(false);
    }
  }

  async function resendCode() {
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      await api.post("/investor/auth/signup/resend-code", { email });
      setNotice(AUTH_MESSAGES.signupCodeSent);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? signupMessage(cause.status, cause.message)
          : AUTH_MESSAGES.unavailable,
      );
    } finally {
      setPending(false);
    }
  }

  if (awaitingCode) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">
            Confirme o e-mail
          </h1>
          <p className="text-sm text-muted-foreground">
            Digite o código de {CODE_LENGTH} dígitos enviado para {email}.
          </p>
        </div>

        {notice ? (
          <Alert>
            <CheckIcon />
            <AlertDescription className="text-muted-foreground">
              {notice}
            </AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

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
            Criar conta
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={resendCode}
          >
            Enviar outro código
          </Button>

          <Button type="button" variant="ghost" size="sm" onClick={backToDetails}>
            Corrigir os dados
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Informe seus dados e enviaremos um código para confirmar o e-mail.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={submitDetails} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Ao menos {MIN_PASSWORD_LENGTH} caracteres, combinando maiúsculas,
            minúsculas, números e símbolos.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="passwordConfirm">Confirme a senha</Label>
          <Input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
          />
        </div>

        <Button
          type="submit"
          disabled={pending || !name || !email || !password || !passwordConfirm}
        >
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          Continuar
        </Button>

        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Já tenho conta</Link>
        </Button>
      </form>
    </div>
  );
}
