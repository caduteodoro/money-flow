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
  const hasTransactionsInPeriod = summary.kpis.transactionCount > 0;
  const activeFilterLabel = formatFilterLabel(activeFilter);
  const periodRangeLabel = formatPeriodRange(summary.period);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar activeItem="dashboard" />
      <main className="min-w-0 lg:pl-72">
        <Topbar
          eyebrow="Dashboard real"
          periodLabel={activeFilterLabel}
          title="Dashboard financeiro"
          user={user}
        />
        <div className="min-w-0 space-y-6 px-4 py-5 sm:px-5 lg:px-8 lg:py-7">
          <section className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-soft">
            <div className="border-l-4 border-brand-teal p-5 sm:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Sessao ativa</p>
                  <h2 className="mt-2 text-balance text-xl font-bold text-brand-navy sm:text-2xl">
                    Ola, {user.name}. Seu GPS financeiro esta pronto para recalcular a rota.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {summary.hasImportedTransactions
                      ? "Dados calculados a partir das transacoes importadas para o seu usuario."
                      : "Importe seu primeiro CSV ficticio para ver os indicadores reais."}
                  </p>
                  {periodRangeLabel ? (
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Intervalo considerado: {periodRangeLabel}.
                    </p>
                  ) : null}
                </div>

                <DashboardPeriodFilter activeFilter={activeFilter} />
              </div>
            </div>
          </section>

          {hasTransactionsInPeriod ? (
            <>
              <DashboardKpis kpis={summary.kpis} largestExpense={summary.largestExpense} />

              <DashboardCharts charts={summary.charts} insights={summary.insights} />

              <Card>
                <CardHeader>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Movimento recente</p>
                    <h2 className="mt-1 text-base font-bold text-brand-navy">Ultimas transacoes</h2>
                  </div>
                </CardHeader>
                <CardBody>
                  <TransactionsTable transactions={summary.recentTransactions} />
                </CardBody>
              </Card>
            </>
          ) : (
            <DashboardEmptyState
              filterLabel={activeFilterLabel}
              periodRangeLabel={periodRangeLabel}
              variant={summary.hasImportedTransactions ? "empty-period" : "no-data"}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function formatPeriodRange(period: DashboardSummary["period"]) {
  if (!period.startDate || !period.endDate) {
    return null;
  }

  const start = formatDate(period.startDate);
  const end = formatDate(period.endDate);

  return start === end ? start : `${start} a ${end}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
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
