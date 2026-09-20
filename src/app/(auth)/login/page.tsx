import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <Suspense fallback={<FormFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function FormFallback() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
