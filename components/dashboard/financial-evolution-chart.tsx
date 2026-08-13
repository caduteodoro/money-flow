import { EChartsClient } from "@/components/dashboard/echarts-client";
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

      <p className="text-xs leading-5 text-slate-500">
        Entradas aparecem acima de zero, saídas abaixo de zero e a linha acompanha o resultado acumulado.
      </p>

      <details className="rounded-lg border border-slate-200 bg-slate-50">
        <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-bold text-brand-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal">
          Consultar dados da evolução em tabela
        </summary>
        <div className="overflow-x-auto border-t border-slate-200">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-white text-slate-500">
              <tr>
                <th className="px-3 py-2">Período</th>
                <th className="px-3 py-2 text-right">Entradas</th>
                <th className="px-3 py-2 text-right">Saídas</th>
                <th className="px-3 py-2 text-right">Resultado acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {model.labels.map((label, index) => (
                <tr key={`${label}-${index}`}>
                  <td className="px-3 py-2 font-medium text-brand-navy">{label}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700">
                    {formatDashboardCurrency(model.incomeCents[index] ?? 0)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-rose-700">
                    {formatDashboardCurrency(model.expenseCents[index] ?? 0)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-sky-700">
                    {formatDashboardCurrency(model.cumulativeResultCents[index] ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
