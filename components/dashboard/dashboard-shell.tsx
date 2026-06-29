import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardKpis } from "@/components/dashboard/dashboard-kpis";
import { DashboardPeriodFilter } from "@/components/dashboard/dashboard-period-filter";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import type { DashboardDateFilterId, DashboardSummary } from "@/lib/dashboard/dashboard-types";

type DashboardShellProps = {
  user: {
    name: string;
    email: string;
  };
  summary: DashboardSummary;
  activeFilter: DashboardDateFilterId;
};

export function DashboardShell({ user, summary, activeFilter }: DashboardShellProps) {
  const hasTransactions = summary.kpis.transactionCount > 0;

  return (
    <div className="min-h-screen bg-brand-surface">
      <Sidebar />
      <main className="lg:pl-72">
        <Topbar
          eyebrow="Sprint 3"
          periodLabel={formatFilterLabel(activeFilter)}
          title="Dashboard financeiro"
          user={user}
        />
        <div className="space-y-6 px-5 py-6 lg:px-8">
          <section className="rounded-lg border border-teal-100 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-teal">Sessao ativa</p>
                <h2 className="mt-2 text-xl font-bold text-brand-navy">
                  Ola, {user.name}. Seu GPS financeiro esta pronto para recalcular a rota.
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {hasTransactions
                    ? "Dados calculados a partir das transacoes importadas para o seu usuario."
                    : "Importe seu primeiro CSV ficticio para ver os indicadores reais."}
                </p>
              </div>

              <DashboardPeriodFilter activeFilter={activeFilter} />
            </div>
          </section>

          {hasTransactions ? (
            <>
              <DashboardKpis kpis={summary.kpis} largestExpense={summary.largestExpense} />

              <DashboardCharts charts={summary.charts} insights={summary.insights} />

              <Card>
                <CardHeader>
                  <h2 className="text-base font-bold text-brand-navy">Ultimas transacoes</h2>
                </CardHeader>
                <CardBody>
                  <TransactionsTable transactions={summary.recentTransactions} />
                </CardBody>
              </Card>
            </>
          ) : (
            <DashboardEmptyState />
          )}
        </div>
      </main>
    </div>
  );
}

function formatFilterLabel(filter: DashboardDateFilterId) {
  const labels: Record<DashboardDateFilterId, string> = {
    "imported-period": "Periodo importado",
    "last-30-days": "Ultimos 30 dias",
    "current-month": "Mes atual",
    "previous-month": "Mes anterior",
  };

  return labels[filter];
}
