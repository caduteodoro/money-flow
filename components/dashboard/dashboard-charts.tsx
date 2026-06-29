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
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-brand-navy">Evolucao financeira</h2>
            <span className="text-xs font-semibold text-slate-500">
              {charts.granularity === "month" ? "Agrupado por mes" : "Agrupado por dia"}
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <FinancialEvolutionChart points={charts.cashflow} />
        </CardBody>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-brand-navy">Entradas vs saidas</h2>
          </CardHeader>
          <CardBody>
            <IncomeExpenseChart comparison={charts.incomeExpense} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-brand-navy">Insights basicos</h2>
          </CardHeader>
          <CardBody>
            <BasicInsights insights={insights} />
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
