import { CategoryDestinationChart } from "@/components/dashboard/category-destination-chart";
import { FinancialEvolutionChart } from "@/components/dashboard/financial-evolution-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <section className="flex min-w-0 flex-col gap-6" aria-label="Visualizações analíticas">
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Fluxo do período</p>
          <CardTitle>Evolução financeira</CardTitle>
          <CardDescription>Entradas, saídas e resultado acumulado no mesmo eixo monetário.</CardDescription>
          <Badge className="mt-2 w-fit" variant="secondary">
            {granularity === "month" ? "Agrupado por mês" : "Agrupado por dia"}
          </Badge>
        </CardHeader>
        <CardContent>
          <FinancialEvolutionChart model={evolutionModel} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Destino das despesas</p>
          <CardTitle>Onde o dinheiro foi usado</CardTitle>
          <CardDescription>Ranking por categoria raiz, com Outros e Sem categoria tratados separadamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryDestinationChart activeFilter={activeFilter} model={categoryModel} />
        </CardContent>
      </Card>
    </section>
  );
}
