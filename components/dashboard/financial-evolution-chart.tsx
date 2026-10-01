import { EChartsClient } from "@/components/dashboard/echarts-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardEvolutionChartModel } from "@/lib/dashboard/dashboard-types";
import { formatDashboardCurrency } from "@/lib/dashboard/dashboard-visualization";

type FinancialEvolutionChartProps = {
  model: DashboardEvolutionChartModel;
};

export function FinancialEvolutionChart({ model }: FinancialEvolutionChartProps) {
  return (
    <div className="space-y-4">
      <EChartsClient
        ariaLabel="Gráfico de evolução financeira com entradas, saídas e resultado acumulado"
        className="h-72 sm:h-80"
        kind="evolution"
        model={model}
      />

      <p className="text-xs leading-5 text-muted-foreground">
        Entradas aparecem acima de zero, saídas abaixo de zero e a linha acompanha o resultado acumulado.
      </p>

      <details className="overflow-hidden rounded-lg border bg-muted/30">
        <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Consultar dados da evolução em tabela
        </summary>
        <div className="overflow-x-auto border-t bg-background">
          <Table className="min-w-[620px] text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="text-right">Resultado acumulado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {model.labels.map((label, index) => (
                <TableRow key={`${label}-${index}`}>
                  <TableCell className="font-medium">{label}</TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-700">
                    {formatDashboardCurrency(model.incomeCents[index] ?? 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-rose-700">
                    {formatDashboardCurrency(model.expenseCents[index] ?? 0)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-sky-700">
                    {formatDashboardCurrency(model.cumulativeResultCents[index] ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </details>
    </div>
  );
}
