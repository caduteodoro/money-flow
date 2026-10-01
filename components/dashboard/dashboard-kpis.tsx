import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  ListChecks,
  TrendingDown,
  WalletCards,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      icon: <ArrowDownLeft aria-hidden="true" />,
      comparison: comparisons.totalIncomeCents,
      favorableDirection: "up" as const,
      actionHref: buildTransactionsUrl({ period, direction: "INCOME" }),
      actionLabel: "Ver entradas",
    },
    {
      label: "Saídas",
      value: formatCurrency(kpis.totalExpenseCents),
      helper: "Total gasto no período selecionado.",
      icon: <ArrowUpRight aria-hidden="true" />,
      comparison: comparisons.totalExpenseCents,
      favorableDirection: "down" as const,
      actionHref: buildTransactionsUrl({ period, direction: "EXPENSE" }),
      actionLabel: "Ver saídas",
    },
    {
      label: "Resultado do período",
      value: formatCurrency(kpis.periodResultCents),
      helper: "Entradas menos saídas; não representa saldo em conta.",
      icon: <CircleDollarSign aria-hidden="true" />,
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
      icon: <TrendingDown aria-hidden="true" />,
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
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="dashboard-summary-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Resumo do período</p>
        <h2 className="mt-1 text-lg font-semibold" id="dashboard-summary-title">Indicadores principais</h2>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>
      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2">
        <SecondaryMetric
          actionHref={largestExpense ? buildTransactionsUrl({ period, transactionId: largestExpense.id }) : undefined}
          actionLabel="Localizar transação"
          helper={largestExpense ? truncateText(largestExpense.description, 68) : "Nenhuma saída no período."}
          icon={<WalletCards aria-hidden="true" />}
          label="Maior saída"
          value={largestExpense ? formatCurrency(largestExpense.amountCents) : "Sem saídas"}
        />
        <SecondaryMetric
          actionHref={buildTransactionsUrl({ period })}
          actionLabel="Ver todas"
          helper="Entradas e saídas incluídas nos cálculos."
          icon={<ListChecks aria-hidden="true" />}
          label="Transações financeiras"
          value={String(kpis.includedTransactionCount)}
        />
        </CardContent>
      </Card>
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
    <article className="flex min-w-0 items-start gap-3 rounded-lg bg-muted p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-primary [&>svg]:size-4">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-lg font-semibold tabular-nums">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground" title={helper}>{helper}</p>
        {actionHref && actionLabel ? (
          <LinkButton className="mt-1" href={actionHref} size="xs" variant="link">{actionLabel}</LinkButton>
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
