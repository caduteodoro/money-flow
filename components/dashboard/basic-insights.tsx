import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LinkButton } from "@/components/ui/button";
import type { DashboardDateFilterId, DashboardInsight } from "@/lib/dashboard/dashboard-types";
import { buildDashboardDrillThroughUrl } from "@/lib/transactions";

type BasicInsightsProps = {
  insights: DashboardInsight[];
  activeFilter: DashboardDateFilterId;
};

const toneClasses: Record<DashboardInsight["tone"], string> = {
  positive: "border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  neutral: "bg-muted/30",
};

export function BasicInsights({ insights, activeFilter }: BasicInsightsProps) {
  if (insights.length === 0) {
    return <Alert><Info aria-hidden="true" /><AlertDescription>Não há sinais analíticos adicionais para este recorte. Os indicadores principais continuam disponíveis acima.</AlertDescription></Alert>;
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => {
        const href = insight.target ? buildDashboardDrillThroughUrl(insight.target, activeFilter) : null;
        return (
          <Alert key={insight.id} className={toneClasses[insight.tone]}>
            <InsightIcon tone={insight.tone} />
            <AlertTitle className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <span>{insight.title}</span>
              {typeof insight.amountCents === "number" ? <span className="shrink-0 tabular-nums">{formatCurrency(insight.amountCents)}</span> : null}
            </AlertTitle>
            <AlertDescription className="text-current/80">
              <p>{insight.description}</p>
              {href ? <LinkButton className="mt-2 px-0" href={href} size="sm" variant="link">{formatActionLabel(insight)}</LinkButton> : null}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

function formatActionLabel(insight: DashboardInsight) {
  if (insight.target?.kind === "TRANSACTION") return "Localizar transação";
  if (insight.target?.kind === "DAY") return "Ver despesas do dia";
  if (insight.target?.kind === "UNCATEGORIZED") return "Revisar sem categoria";
  return "Ver despesas relacionadas";
}

function InsightIcon({ tone }: { tone: DashboardInsight["tone"] }) {
  if (tone === "positive") return <CheckCircle2 aria-hidden="true" />;
  if (tone === "warning") return <AlertTriangle aria-hidden="true" />;
  return <Info aria-hidden="true" />;
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountCents / 100);
}
