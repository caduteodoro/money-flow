import type { DashboardIncomeExpenseComparison } from "@/lib/dashboard/dashboard-types";

type IncomeExpenseChartProps = {
  comparison: DashboardIncomeExpenseComparison;
};

export function IncomeExpenseChart({ comparison }: IncomeExpenseChartProps) {
  const total = comparison.incomeCents + comparison.expenseCents;
  const incomePercent = total > 0 ? Math.round((comparison.incomeCents / total) * 100) : 0;
  const expensePercent = total > 0 ? 100 - incomePercent : 0;

  return (
    <div className="space-y-5">
      <ComparisonRow
        amountCents={comparison.incomeCents}
        label="Entradas"
        percent={incomePercent}
        tone="income"
      />
      <ComparisonRow
        amountCents={comparison.expenseCents}
        label="Saidas"
        percent={expensePercent}
        tone="expense"
      />
    </div>
  );
}

type ComparisonRowProps = {
  label: string;
  amountCents: number;
  percent: number;
  tone: "income" | "expense";
};

function ComparisonRow({ label, amountCents, percent, tone }: ComparisonRowProps) {
  const colorClass = tone === "income" ? "bg-emerald-500" : "bg-rose-500";

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-brand-navy">{label}</span>
        <span className="text-slate-600">{formatCurrency(amountCents)}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100" title={`${label}: ${percent}%`}>
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{percent}% do movimento financeiro do periodo.</p>
    </div>
  );
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}
