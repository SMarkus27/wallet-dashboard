"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircleIcon, LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);

    try {
      await api.post("/investor/auth/logout");
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Sair"
      onClick={logout}
      disabled={pending}
    >
      {pending ? <LoaderCircleIcon className="animate-spin" /> : <LogOutIcon />}
    </Button>
  );
}
