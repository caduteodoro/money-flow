import { ArrowRight, FileSpreadsheet, ShieldCheck, TrendingUp } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

const highlights = [
  {
    title: "Importe extratos",
    text: "CSV no MVP, OFX depois do MVP inicial.",
    icon: FileSpreadsheet,
  },
  {
    title: "Leia seus KPIs",
    text: "Entradas, saidas, saldo, medias e evolucao mensal.",
    icon: TrendingUp,
  },
  {
    title: "Privacidade em primeiro lugar",
    text: "Arquitetura preparada para LGPD, auditoria e isolamento por usuario.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-surface">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-brand-navy text-sm font-bold text-white">
              MF
            </span>
            <div>
              <p className="font-bold text-brand-navy">Money Flow</p>
              <p className="text-xs text-slate-500">Seu GPS financeiro pessoal.</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <LinkButton href="/login" variant="ghost">
              Entrar
            </LinkButton>
            <LinkButton href="/register" variant="secondary">
              Criar conta
            </LinkButton>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-teal">MVP local</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-tight text-brand-navy sm:text-6xl">
              Money Flow
            </h1>
            <p className="mt-5 max-w-2xl text-xl text-slate-600">Seu GPS financeiro pessoal.</p>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600">
              Um sistema web para transformar extratos bancarios em visao clara: KPIs,
              dashboards, categorias editaveis e insights financeiros que ajudam a decidir melhor.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/register">
                Criar minha conta
                <ArrowRight className="size-4" aria-hidden="true" />
              </LinkButton>
              <LinkButton href="/login" variant="secondary">
                Entrar
              </LinkButton>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="rounded-md bg-slate-50 p-4">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-teal">Abril 2026</p>
                  <p className="text-2xl font-bold text-brand-navy">R$ 2.435,60</p>
                </div>
                <span className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                  +12%
                </span>
              </div>
              <div className="flex h-56 items-end gap-3">
                {[42, 60, 48, 78, 54, 86, 70].map((height, index) => (
                  <div key={index} className="flex flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-brand-teal"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 pb-8 md:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5">
                <Icon className="size-5 text-brand-teal" aria-hidden="true" />
                <h2 className="mt-4 text-base font-bold text-brand-navy">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
