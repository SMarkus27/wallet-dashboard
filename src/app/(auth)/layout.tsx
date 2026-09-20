import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <span className="text-sm font-semibold tracking-tight">Wallet</span>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6">{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
