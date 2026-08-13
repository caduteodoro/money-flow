import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  ListChecks,
  TrendingDown,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { KpiCard } from "@/components/dashboard/kpi-card";
import type {
  DashboardDateFilterId,
  DashboardKpiComparisons,
  DashboardLargestExpense,
  FinancialKpis,
} from "@/lib/dashboard/dashboard-types";
import { buildTransactionsUrl } from "@/lib/transactions";

type DashboardKpisProps = {
  kpis: FinancialKpis;
  comparisons: DashboardKpiComparisons;
  largestExpense: DashboardLargestExpense;
  period: DashboardDateFilterId;
};

export function DashboardKpis({ kpis, comparisons, largestExpense, period }: DashboardKpisProps) {
  const cards = [
    {
      label: "Entradas",
      value: formatCurrency(kpis.totalIncomeCents),
      helper: "Total recebido no período selecionado.",
      accent: "bg-emerald-50 text-emerald-700",
      icon: <ArrowDownLeft className="size-5" aria-hidden="true" />,
      comparison: comparisons.totalIncomeCents,
      favorableDirection: "up" as const,
      actionHref: buildTransactionsUrl({ period, direction: "INCOME" }),
      actionLabel: "Ver entradas",
    },
    {
      label: "Saídas",
      value: formatCurrency(kpis.totalExpenseCents),
      helper: "Total gasto no período selecionado.",
      accent: "bg-rose-50 text-rose-700",
      icon: <ArrowUpRight className="size-5" aria-hidden="true" />,
      comparison: comparisons.totalExpenseCents,
      favorableDirection: "down" as const,
      actionHref: buildTransactionsUrl({ period, direction: "EXPENSE" }),
      actionLabel: "Ver saídas",
    },
    {
      label: "Resultado do período",
      value: formatCurrency(kpis.periodResultCents),
      helper: "Entradas menos saídas; não representa saldo em conta.",
      accent: "bg-sky-50 text-sky-700",
      icon: <CircleDollarSign className="size-5" aria-hidden="true" />,
      comparison: comparisons.periodResultCents,
      favorableDirection: "up" as const,
    },
    {
      label: "Gasto médio por saída",
      value: kpis.averageExpenseCents === null ? "Sem saídas" : formatCurrency(kpis.averageExpenseCents),
      helper:
        kpis.averageExpenseCents === null
          ? "Nenhuma despesa no período."
          : "Despesas divididas pela quantidade de saídas.",
      accent: "bg-amber-50 text-amber-700",
      icon: <TrendingDown className="size-5" aria-hidden="true" />,
      comparison: comparisons.averageExpenseCents,
      favorableDirection: "down" as const,
      actionHref:
        kpis.averageExpenseCents === null
          ? undefined
          : buildTransactionsUrl({ period, direction: "EXPENSE" }),
      actionLabel: kpis.averageExpenseCents === null ? undefined : "Ver despesas",
    },
  ];

  return (
    <section className="min-w-0 space-y-4" aria-labelledby="dashboard-summary-title">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Resumo do período</p>
        <h2 className="mt-1 text-lg font-bold text-brand-navy" id="dashboard-summary-title">Indicadores principais</h2>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-2">
        <SecondaryMetric
          actionHref={largestExpense ? buildTransactionsUrl({ period, transactionId: largestExpense.id }) : undefined}
          actionLabel="Localizar transação"
          helper={largestExpense ? truncateText(largestExpense.description, 68) : "Nenhuma saída no período."}
          icon={<WalletCards className="size-4" aria-hidden="true" />}
          label="Maior saída"
          value={largestExpense ? formatCurrency(largestExpense.amountCents) : "Sem saídas"}
        />
        <SecondaryMetric
          actionHref={buildTransactionsUrl({ period })}
          actionLabel="Ver todas"
          helper="Entradas e saídas incluídas nos cálculos."
          icon={<ListChecks className="size-4" aria-hidden="true" />}
          label="Transações financeiras"
          value={String(kpis.includedTransactionCount)}
        />
      </div>
    </section>
  );
}

function SecondaryMetric({
  label,
  value,
  helper,
  icon,
  actionHref,
  actionLabel,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <article className="flex min-w-0 items-start gap-3 rounded-lg bg-slate-50 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-brand-teal">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 break-words text-lg font-bold tabular-nums text-brand-navy">{value}</p>
        <p className="mt-1 truncate text-xs text-slate-500" title={helper}>{helper}</p>
        {actionHref && actionLabel ? (
          <Link className="mt-1 inline-flex min-h-8 items-center text-xs font-bold text-brand-teal underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href={actionHref}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountCents / 100);
}

function truncateText(text: string, maxLength: number) {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}
