import { BasicInsights } from "@/components/dashboard/basic-insights";
import { FinancialEvolutionChart } from "@/components/dashboard/financial-evolution-chart";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { DashboardCharts as DashboardChartsData, DashboardInsight } from "@/lib/dashboard/dashboard-types";

type DashboardChartsProps = {
  charts: DashboardChartsData;
  insights: DashboardInsight[];
};

export function DashboardCharts({ charts, insights }: DashboardChartsProps) {
  return (
    <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Fluxo do periodo</p>
              <h2 className="mt-1 text-base font-bold text-brand-navy">Evolucao financeira</h2>
            </div>
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {charts.granularity === "month" ? "Agrupado por mes" : "Agrupado por dia"}
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <FinancialEvolutionChart points={charts.cashflow} />
        </CardBody>
      </Card>

      <div className="min-w-0 space-y-6">
        <Card>
          <CardHeader>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Composicao</p>
              <h2 className="mt-1 text-base font-bold text-brand-navy">Entradas vs saidas</h2>
            </div>
          </CardHeader>
          <CardBody>
            <IncomeExpenseChart comparison={charts.incomeExpense} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Leitura rapida</p>
              <h2 className="mt-1 text-base font-bold text-brand-navy">Insights basicos</h2>
            </div>
          </CardHeader>
          <CardBody>
            <BasicInsights insights={insights} />
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
