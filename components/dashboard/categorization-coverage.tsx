import { CheckCircle2, CircleHelp } from "lucide-react";

import { LinkButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardCategoryCoverage, DashboardDateFilterId } from "@/lib/dashboard/dashboard-types";
import { buildTransactionsUrl } from "@/lib/transactions";

export function CategorizationCoverage({ coverage, period }: { coverage: DashboardCategoryCoverage; period: DashboardDateFilterId }) {
  const hasExpenseBasis = coverage.totalExpenseCount > 0;
  const amountPercentage = coverage.amountCoveragePercentage ?? 0;

  return (
    <Card>
      <CardContent className="p-4 lg:p-5">
        {hasExpenseBasis ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.75fr)_minmax(300px,1.25fr)_auto] xl:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Cobertura de categorização</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatPercentage(coverage.amountCoveragePercentage)}</p>
              <p className="mt-1 text-xs text-muted-foreground">por valor · {formatPercentage(coverage.countCoveragePercentage)} por quantidade</p>
            </div>

            <div>
              <div
                aria-label={`${formatPercentage(coverage.amountCoveragePercentage)} das despesas categorizadas por valor`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.round(amountPercentage)}
                className="h-2.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, amountPercentage))}%` }} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Metric
                  icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
                  label="Categorizadas"
                  value={`${formatCurrency(coverage.categorizedExpenseCents)} · ${coverage.categorizedExpenseCount}`}
                />
                <Metric
                  icon={<CircleHelp className="size-4" aria-hidden="true" />}
                  label="Sem categoria"
                  value={`${formatCurrency(coverage.uncategorizedExpenseCents)} · ${coverage.uncategorizedExpenseCount}`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
              <LinkButton href={buildTransactionsUrl({ period, direction: "EXPENSE", filter: "categorized" })} variant="outline">
                Ver categorizadas
              </LinkButton>
              <LinkButton href={buildTransactionsUrl({ period, direction: "EXPENSE", filter: "uncategorized" })}>
                Revisar sem categoria
              </LinkButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">Não há despesas como base neste período.</p>
              <p className="mt-1 text-sm text-muted-foreground">Os percentuais permanecem indisponíveis até existir uma saída.</p>
            </div>
            <LinkButton href={buildTransactionsUrl({ period, direction: "EXPENSE" })} variant="outline">
              Ver saídas do período
            </LinkButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
      <span className="text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  );
}

function formatPercentage(value: number | null) {
  return value === null ? "Sem base" : `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}
