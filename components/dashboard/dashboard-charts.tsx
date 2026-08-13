import { CategoryDestinationChart } from "@/components/dashboard/category-destination-chart";
import { FinancialEvolutionChart } from "@/components/dashboard/financial-evolution-chart";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type {
  DashboardCategoryDestinationModel,
  DashboardChartGranularity,
  DashboardDateFilterId,
  DashboardEvolutionChartModel,
} from "@/lib/dashboard/dashboard-types";

type DashboardChartsProps = {
  activeFilter: DashboardDateFilterId;
  categoryModel: DashboardCategoryDestinationModel;
  evolutionModel: DashboardEvolutionChartModel;
  granularity: DashboardChartGranularity;
};

export function DashboardCharts({
  activeFilter,
  categoryModel,
  evolutionModel,
  granularity,
}: DashboardChartsProps) {
  return (
    <section className="min-w-0 space-y-6" aria-label="Visualizações analíticas">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Fluxo do período</p>
              <h2 className="mt-1 text-lg font-bold text-brand-navy">Evolução financeira</h2>
              <p className="mt-1 text-sm text-slate-500">Entradas, saídas e resultado acumulado no mesmo eixo monetário.</p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {granularity === "month" ? "Agrupado por mês" : "Agrupado por dia"}
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <FinancialEvolutionChart model={evolutionModel} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Destino das despesas</p>
            <h2 className="mt-1 text-lg font-bold text-brand-navy">Onde o dinheiro foi usado</h2>
            <p className="mt-1 text-sm text-slate-500">Ranking por categoria raiz, com Outros e Sem categoria tratados separadamente.</p>
          </div>
        </CardHeader>
        <CardBody>
          <CategoryDestinationChart activeFilter={activeFilter} model={categoryModel} />
        </CardBody>
      </Card>
    </section>
  );
}
