import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiPostStatus } from "@/lib/api/server";
import { AUTH_MESSAGES } from "@/lib/auth/messages";

export const metadata: Metadata = { title: "Definir nova senha" };

const ACCEPTED = 202;

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = await isTokenValid(token);

  if (!valid) return <ExpiredLink />;

  return <ResetPasswordForm token={token} />;
}

async function isTokenValid(token: string) {
  try {
    const status = await apiPostStatus("/investor/auth/recovery/verify-token", {
      token,
    });
    return status === ACCEPTED;
  } catch {
    return false;
  }
}

function ExpiredLink() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Link indisponível</h1>
        <p className="text-sm text-muted-foreground">
          {AUTH_MESSAGES.recoveryExpired}
        </p>
      </div>

      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertDescription>
          Por segurança, cada link vale por uma hora e só pode ser usado uma vez.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-2">
        <Button asChild>
          <Link href="/forgot-password">Pedir um novo link</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Voltar para o login</Link>
        </Button>
      </div>
    </div>
  );
}
