import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { DashboardInsight } from "@/lib/dashboard/dashboard-types";

type BasicInsightsProps = {
  insights: DashboardInsight[];
};

const toneClasses: Record<DashboardInsight["tone"], string> = {
  positive: "border-emerald-100 bg-emerald-50/80 text-emerald-900",
  warning: "border-amber-100 bg-amber-50/90 text-amber-900",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

const iconClasses: Record<DashboardInsight["tone"], string> = {
  positive: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  neutral: "bg-white text-slate-500",
};

export function BasicInsights({ insights }: BasicInsightsProps) {
  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <article key={insight.id} className={`rounded-xl border p-4 ${toneClasses[insight.tone]}`}>
          <div className="flex gap-3">
            <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${iconClasses[insight.tone]}`}>
              <InsightIcon tone={insight.tone} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="text-sm font-bold">{insight.title}</h3>
                {typeof insight.amountCents === "number" ? (
                  <span className="shrink-0 text-sm font-bold">{formatCurrency(insight.amountCents)}</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-6">{insight.description}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function InsightIcon({ tone }: { tone: DashboardInsight["tone"] }) {
  if (tone === "positive") {
    return <CheckCircle2 className="size-4" aria-hidden="true" />;
  }

  if (tone === "warning") {
    return <AlertTriangle className="size-4" aria-hidden="true" />;
  }

  return <Info className="size-4" aria-hidden="true" />;
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}
