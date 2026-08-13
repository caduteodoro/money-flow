import { CheckCircle2, CircleHelp } from "lucide-react";

import { Card, CardBody } from "@/components/ui/card";
import type { DashboardCategoryCoverage, DashboardDateFilterId } from "@/lib/dashboard/dashboard-types";
import { buildTransactionsUrl } from "@/lib/transactions";
import Link from "next/link";

export function CategorizationCoverage({ coverage, period }: { coverage: DashboardCategoryCoverage; period: DashboardDateFilterId }) {
  const hasExpenseBasis = coverage.totalExpenseCount > 0;
  const amountPercentage = coverage.amountCoveragePercentage ?? 0;

  return (
    <Card>
      <CardBody className="p-4 lg:p-5">
        {hasExpenseBasis ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.75fr)_minmax(300px,1.25fr)_auto] xl:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Cobertura de categorização</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-brand-navy">{formatPercentage(coverage.amountCoveragePercentage)}</p>
              <p className="mt-1 text-xs text-slate-500">por valor · {formatPercentage(coverage.countCoveragePercentage)} por quantidade</p>
            </div>

            <div>
              <div
                aria-label={`${formatPercentage(coverage.amountCoveragePercentage)} das despesas categorizadas por valor`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.round(amountPercentage)}
                className="h-3 overflow-hidden rounded-full bg-amber-100"
                role="progressbar"
              >
                <div className="h-full rounded-full bg-brand-teal" style={{ width: `${Math.min(100, Math.max(0, amountPercentage))}%` }} />
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
              <CoverageLink href={buildTransactionsUrl({ period, direction: "EXPENSE", filter: "categorized" })}>Ver categorizadas</CoverageLink>
              <CoverageLink href={buildTransactionsUrl({ period, direction: "EXPENSE", filter: "uncategorized" })} primary>Revisar sem categoria</CoverageLink>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-brand-navy">Não há despesas como base neste período.</p>
              <p className="mt-1 text-sm text-slate-600">Os percentuais permanecem indisponíveis até existir uma saída.</p>
            </div>
            <CoverageLink href={buildTransactionsUrl({ period, direction: "EXPENSE" })}>Ver saídas do período</CoverageLink>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-brand-teal">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold tabular-nums text-brand-navy">{value}</p>
      </div>
    </div>
  );
}

function CoverageLink({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      className={`inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${primary ? "bg-brand-teal text-white hover:bg-teal-700" : "border border-slate-200 bg-white text-brand-navy hover:border-teal-200 hover:bg-teal-50"}`}
      href={href}
    >
      {children}
    </Link>
  );
}

function formatPercentage(value: number | null) {
  return value === null ? "Sem base" : `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}
