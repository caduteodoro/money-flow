import { BasicInsights } from "@/components/dashboard/basic-insights";
import { CategorizationCoverage } from "@/components/dashboard/categorization-coverage";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardKpis } from "@/components/dashboard/dashboard-kpis";
import { DashboardPeriodFilter } from "@/components/dashboard/dashboard-period-filter";
import { ExpenseHighlights } from "@/components/dashboard/expense-highlights";
import { ExpenseFlow } from "@/components/dashboard/expense-flow";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { DashboardDateFilterId, DashboardSummary } from "@/lib/dashboard/dashboard-types";
import {
  buildDashboardCategoryDestinationModel,
  buildDashboardEvolutionChartModel,
} from "@/lib/dashboard/dashboard-visualization";

type DashboardShellProps = {
  user: {
    name: string;
    email: string;
  };
  summary: DashboardSummary;
  activeFilter: DashboardDateFilterId;
};

export function DashboardShell({ user, summary, activeFilter }: DashboardShellProps) {
  const hasTransactionsInPeriod = summary.periodTransactionCount > 0;
  const activeFilterLabel = formatFilterLabel(activeFilter);
  const periodRangeLabel = formatPeriodRange(summary.period);
  const evolutionModel = buildDashboardEvolutionChartModel(summary.charts.cashflow);
  const categoryModel = buildDashboardCategoryDestinationModel(summary.categories);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar activeItem="dashboard" />
      <main className="min-w-0 lg:pl-72">
        <Topbar eyebrow="Cockpit financeiro" showContextBadge={false} title="Dashboard financeiro" user={user} />
        <div className="min-w-0 space-y-6 px-4 py-5 sm:px-5 lg:px-8 lg:py-7">
          <section className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-soft">
            <div className="border-l-4 border-brand-teal p-5 sm:p-6">
              <div className="flex flex-col gap-5">
                <div className="max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Contexto analítico</p>
                  <h2 className="mt-2 text-balance text-xl font-bold text-brand-navy sm:text-2xl">
                    Olá, {user.name}. Este é o resultado calculado para {activeFilterLabel.toLocaleLowerCase("pt-BR")}.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {summary.hasImportedTransactions
                      ? "Entradas e saídas são calculadas pelas transações importadas deste usuário; transferências e estornos ficam fora dos indicadores financeiros."
                      : "Importe seu primeiro CSV fictício para ver os indicadores calculados."}
                  </p>
                  {periodRangeLabel ? (
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Intervalo considerado: {periodRangeLabel}. O resultado do período não representa saldo bancário.
                    </p>
                  ) : null}
                </div>

                <DashboardPeriodFilter activeFilter={activeFilter} />
              </div>
            </div>
          </section>

          {hasTransactionsInPeriod ? (
            <>
              {summary.kpis.includedTransactionCount === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">
                  Há movimentações neste período, mas somente transferências ou estornos. Elas aparecem nas últimas transações e ficam fora dos indicadores de entradas e saídas.
                </p>
              ) : null}
              <DashboardKpis
                comparisons={summary.comparisons}
                kpis={summary.kpis}
                largestExpense={summary.largestExpense}
                period={activeFilter}
              />

              <DashboardCharts
                activeFilter={activeFilter}
                categoryModel={categoryModel}
                evolutionModel={evolutionModel}
                granularity={summary.charts.granularity}
              />

              <CategorizationCoverage coverage={summary.categories.coverage} period={activeFilter} />

              <ExpenseFlow model={summary.expenseFlow} period={activeFilter} />

              <ExpenseHighlights
                offenders={summary.offenders}
                period={activeFilter}
                totalExpenseCents={summary.kpis.totalExpenseCents}
                expenseCount={summary.categories.coverage.totalExpenseCount}
              />

              <Card>
                <CardHeader>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Sinais do período</p>
                    <h2 className="mt-1 text-lg font-bold text-brand-navy">Leituras contextuais</h2>
                    <p className="mt-1 text-sm text-slate-500">Fatos derivados do recorte atual, sem recomendação financeira.</p>
                  </div>
                </CardHeader>
                <CardBody>
                  <BasicInsights activeFilter={activeFilter} insights={summary.insights} />
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Movimento recente</p>
                    <h2 className="mt-1 text-lg font-bold text-brand-navy">Últimas transações</h2>
                    <p className="mt-1 text-sm text-slate-500">Inclui transferências e estornos para manter o histórico recente transparente.</p>
                  </div>
                </CardHeader>
                <CardBody>
                  <TransactionsTable activeFilter={activeFilter} transactions={summary.recentTransactions} />
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
  if (!period.startInclusive || !period.endExclusive) return null;

  const start = formatDate(period.startInclusive);
  const end = formatDate(new Date(period.endExclusive.getTime() - 1));
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
    "imported-period": "Todo o período importado",
    "last-30-days": "Últimos 30 dias",
    "current-month": "Mês atual",
    "previous-month": "Mês anterior",
  };

  return labels[filter];
}
