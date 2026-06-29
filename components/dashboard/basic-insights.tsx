import type { DashboardInsight } from "@/lib/dashboard/dashboard-types";

type BasicInsightsProps = {
  insights: DashboardInsight[];
};

const toneClasses: Record<DashboardInsight["tone"], string> = {
  positive: "border-emerald-100 bg-emerald-50 text-emerald-800",
  warning: "border-amber-100 bg-amber-50 text-amber-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

export function BasicInsights({ insights }: BasicInsightsProps) {
  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <article key={insight.id} className={`rounded-md border p-4 ${toneClasses[insight.tone]}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-bold">{insight.title}</h3>
              <p className="mt-1 text-sm leading-6">{insight.description}</p>
            </div>
            {typeof insight.amountCents === "number" ? (
              <span className="shrink-0 text-sm font-bold">{formatCurrency(insight.amountCents)}</span>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}
