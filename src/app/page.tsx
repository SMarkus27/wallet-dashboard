import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Wallet Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Painel da carteira conectado à API do Wallet.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ambiente configurado</CardTitle>
          <CardDescription>
            Next.js, Tailwind, tema claro/escuro e camada de acesso à API prontos.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          As abas de Resumo, Proventos, Gráficos e IRPF são adicionadas nas etapas
          seguintes.
        </CardContent>
      </Card>
    </main>
  );
}
