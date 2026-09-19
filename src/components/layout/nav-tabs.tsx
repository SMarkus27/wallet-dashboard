"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DASHBOARD_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seções do painel" className="flex gap-1 overflow-x-auto">
      {DASHBOARD_ROUTES.map((route) => {
        const active = pathname === route.href;

        return (
          <Link
            key={route.href}
            href={route.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
