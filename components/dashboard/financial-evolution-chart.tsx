import type { DashboardTimeSeriesPoint } from "@/lib/dashboard/dashboard-types";

type FinancialEvolutionChartProps = {
  points: DashboardTimeSeriesPoint[];
};

export function FinancialEvolutionChart({ points }: FinancialEvolutionChartProps) {
  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [point.incomeCents, point.expenseCents, Math.abs(point.cumulativeBalanceCents)]),
  );

  return (
    <div className="space-y-4">
      <div className="flex h-48 min-w-0 items-end gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 sm:gap-2">
        {points.map((point, index) => {
          const incomeHeight = calculateBarHeight(point.incomeCents, maxValue);
          const expenseHeight = calculateBarHeight(point.expenseCents, maxValue);
          const showLabel = shouldShowLabel(index, points.length);

          return (
            <div key={point.key} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <div className="flex h-32 w-full max-w-7 items-end justify-center gap-1 sm:max-w-8">
                <div
                  className="w-1/2 rounded-t-sm bg-emerald-500 transition group-hover:bg-emerald-600"
                  style={{ height: `${incomeHeight}%` }}
                  title={`${point.label} - entradas: ${formatCurrency(point.incomeCents)}`}
                />
                <div
                  className="w-1/2 rounded-t-sm bg-rose-500 transition group-hover:bg-rose-600"
                  style={{ height: `${expenseHeight}%` }}
                  title={`${point.label} - saidas: ${formatCurrency(point.expenseCents)}`}
                />
              </div>
              <span className="h-4 max-w-14 truncate text-[11px] text-slate-500">
                {showLabel ? point.label : ""}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap gap-4">
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            Entradas
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-rose-500" />
            Saidas
          </span>
        </div>
        <span>passe o mouse sobre as barras para ver valores</span>
      </div>
    </div>
  );
}

function calculateBarHeight(amountCents: number, maxValue: number) {
  if (amountCents <= 0) {
    return 2;
  }

  return Math.max(6, Math.round((amountCents / maxValue) * 100));
}

function shouldShowLabel(index: number, total: number) {
  if (total <= 8) {
    return true;
  }

  if (index === 0 || index === total - 1) {
    return true;
  }

  return index % Math.ceil(total / 6) === 0;
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}
