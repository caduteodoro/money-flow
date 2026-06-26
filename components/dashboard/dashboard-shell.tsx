import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";

const stats = [
  {
    label: "Entradas",
    value: "R$ 0,00",
    helper: "Aguardando primeira importação.",
    accent: "bg-emerald-50 text-emerald-700",
    icon: <ArrowDownLeft className="size-5" aria-hidden="true" />,
  },
  {
    label: "Saídas",
    value: "R$ 0,00",
    helper: "CSV entra na Sprint 2.",
    accent: "bg-rose-50 text-rose-700",
    icon: <ArrowUpRight className="size-5" aria-hidden="true" />,
  },
  {
    label: "Saldo do período",
    value: "R$ 0,00",
    helper: "Preparado para filtro de datas.",
    accent: "bg-sky-50 text-sky-700",
    icon: <CircleDollarSign className="size-5" aria-hidden="true" />,
  },
  {
    label: "Insights",
    value: "0",
    helper: "Em breve com humor financeiro.",
    accent: "bg-amber-50 text-amber-700",
    icon: <Sparkles className="size-5" aria-hidden="true" />,
  },
];

export function DashboardShell() {
  return (
    <div className="min-h-screen bg-brand-surface">
      <Sidebar />
      <main className="lg:pl-72">
        <Topbar />
        <div className="space-y-6 px-5 py-6 lg:px-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
            <Card>
              <CardHeader>
                <h2 className="text-base font-bold text-brand-navy">Evolução mensal</h2>
              </CardHeader>
              <CardBody>
                <div className="flex h-72 items-end gap-3 rounded-md bg-slate-50 p-4">
                  {[38, 58, 44, 74, 52, 88, 66].map((height, index) => (
                    <div key={index} className="flex flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-brand-teal/70"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-base font-bold text-brand-navy">Insights</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="rounded-md bg-teal-50 p-4 text-sm text-slate-700">
                  Seu orçamento ainda está em ponto morto. A primeira importação vai ligar o GPS.
                </div>
                <div className="rounded-md bg-amber-50 p-4 text-sm text-slate-700">
                  Despesas recorrentes serão destacadas quando houver histórico suficiente.
                </div>
              </CardBody>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <h2 className="text-base font-bold text-brand-navy">Últimas transações</h2>
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <div className="min-w-[680px]">
                  <div className="grid grid-cols-4 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                    <span>Data</span>
                    <span>Descrição</span>
                    <span>Categoria</span>
                    <span className="text-right">Valor</span>
                  </div>
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    Nenhuma transação importada ainda.
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}
