import { ArrowRight, ChartNoAxesCombined, FileSpreadsheet, ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    title: "Importação com preview",
    text: "Valide o CSV antes de confirmar e evite duplicidades com hashes.",
    icon: FileSpreadsheet,
  },
  {
    title: "Cockpit financeiro",
    text: "Leia entradas, saídas, resultado calculado, categorias e evolução.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Privacidade por padrão",
    text: "Sessões protegidas e consultas explicitamente isoladas por usuário.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-svh overflow-hidden">
      <div className="mx-auto flex min-h-svh max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <BrandMark />
          <nav className="flex items-center gap-2" aria-label="Acesso">
            <LinkButton href="/login" variant="ghost">Entrar</LinkButton>
            <LinkButton href="/register" variant="outline">Criar conta</LinkButton>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <Badge variant="secondary">Finanças pessoais com contexto</Badge>
            <h1 className="mt-6 max-w-3xl text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Entenda para onde seu dinheiro está indo.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Importe extratos, organize categorias e acompanhe seu resultado calculado em um cockpit claro, acessível e privado.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/register" size="lg">
                Criar minha conta
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </LinkButton>
              <LinkButton href="/login" size="lg" variant="outline">Já tenho acesso</LinkButton>
            </div>
          </div>

          <Card className="relative shadow-xl shadow-primary/5">
            <CardHeader>
              <Badge className="w-fit" variant="outline">Visão do período</Badge>
              <CardTitle className="text-2xl">Resultado calculado</CardTitle>
              <CardDescription>Entradas e saídas importadas, sem confundir com saldo bancário.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <Metric label="Entradas" value="Visíveis" />
                <Metric label="Saídas" value="Organizadas" />
                <Metric label="Resultado" value="Comparável" />
              </div>
              <div className="mt-8 flex h-52 items-end gap-3" aria-hidden="true">
                {[38, 56, 44, 72, 62, 88, 76].map((height, index) => (
                  <div className="flex flex-1 items-end" key={height + index}>
                    <div
                      className="w-full rounded-t-md bg-primary/80"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 pb-8 md:grid-cols-3" aria-label="Destaques">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} size="sm">
                <CardHeader>
                  <span className="mb-2 grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription className="leading-6">{item.text}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
