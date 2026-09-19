import Link from "next/link";

import { LogoutButton } from "@/components/layout/logout-button";
import { NavTabs } from "@/components/layout/nav-tabs";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { DEFAULT_ROUTE } from "@/lib/routes";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href={DEFAULT_ROUTE} className="text-sm font-semibold tracking-tight">
          Wallet
        </Link>

        <NavTabs />

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
