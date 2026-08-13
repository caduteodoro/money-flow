import { CheckCircle2, CircleHelp } from "lucide-react";

import { LinkButton } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type {
  DashboardCategoryCoverage,
  DashboardDateFilterId,
} from "@/lib/dashboard/dashboard-types";
import { buildTransactionsUrl } from "@/lib/transactions";

export function CategorizationCoverage({
  coverage,
  period,
}: {
  coverage: DashboardCategoryCoverage;
  period: DashboardDateFilterId;
}) {
  const hasExpenseBasis = coverage.totalExpenseCount > 0;
  const amountPercentage = coverage.amountCoveragePercentage ?? 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Cobertura de categorizacao</p>
          <h2 className="mt-1 text-base font-bold text-brand-navy">Quanto das minhas despesas ja esta categorizado?</h2>
        </div>
      </CardHeader>
      <CardBody>
        {hasExpenseBasis ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-2xl font-bold tabular-nums text-brand-navy">{formatPercentage(coverage.amountCoveragePercentage)} por valor</p>
                <p className="text-sm font-semibold text-slate-600">{formatPercentage(coverage.countCoveragePercentage)} por quantidade</p>
              </div>
              <div
                aria-label={`${formatPercentage(coverage.amountCoveragePercentage)} das despesas categorizadas por valor`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.round(amountPercentage)}
                className="mt-3 h-3 overflow-hidden rounded-full bg-amber-100"
                role="progressbar"
              >
                <div className="h-full rounded-full bg-brand-teal" style={{ width: `${Math.min(100, Math.max(0, amountPercentage))}%` }} />
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <CoverageMetric
                  icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
                  label="Categorizadas"
                  value={`${formatCurrency(coverage.categorizedExpenseCents)} · ${coverage.categorizedExpenseCount} ${coverage.categorizedExpenseCount === 1 ? "despesa" : "despesas"}`}
                />
                <CoverageMetric
                  icon={<CircleHelp className="size-4" aria-hidden="true" />}
                  label="Sem categoria"
                  value={`${formatCurrency(coverage.uncategorizedExpenseCents)} · ${coverage.uncategorizedExpenseCount} ${coverage.uncategorizedExpenseCount === 1 ? "despesa" : "despesas"}`}
                />
              </dl>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <LinkButton href={buildTransactionsUrl({ period, direction: "EXPENSE", filter: "categorized" })} variant="secondary">
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
              <p className="font-bold text-brand-navy">Nao ha despesas como base neste periodo.</p>
              <p className="mt-1 text-sm text-slate-600">Os percentuais ficam indisponiveis ate existir ao menos uma transacao de saida.</p>
            </div>
            <LinkButton href={buildTransactionsUrl({ period, direction: "EXPENSE" })} variant="secondary">Ver saidas do periodo</LinkButton>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function CoverageMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">{icon}{label}</dt>
      <dd className="mt-2 text-sm font-semibold tabular-nums text-brand-navy">{value}</dd>
    </div>
  );
}

function formatPercentage(value: number | null) {
  if (value === null) return "Sem base";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}
