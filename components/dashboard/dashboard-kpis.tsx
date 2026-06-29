import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  ListChecks,
  TrendingDown,
  WalletCards,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import type { DashboardLargestExpense, FinancialKpis } from "@/lib/dashboard/dashboard-types";

type DashboardKpisProps = {
  kpis: FinancialKpis;
  largestExpense: DashboardLargestExpense;
};

export function DashboardKpis({ kpis, largestExpense }: DashboardKpisProps) {
  const cards = [
    {
      label: "Entradas",
      value: formatCurrency(kpis.totalIncomeCents),
      helper: "Total recebido no periodo.",
      accent: "bg-emerald-50 text-emerald-700",
      icon: <ArrowDownLeft className="size-5" aria-hidden="true" />,
    },
    {
      label: "Saidas",
      value: formatCurrency(kpis.totalExpenseCents),
      helper: "Total gasto no periodo.",
      accent: "bg-rose-50 text-rose-700",
      icon: <ArrowUpRight className="size-5" aria-hidden="true" />,
    },
    {
      label: "Saldo",
      value: formatCurrency(kpis.balanceCents),
      helper: "Entradas menos saidas.",
      accent: "bg-sky-50 text-sky-700",
      icon: <CircleDollarSign className="size-5" aria-hidden="true" />,
    },
    {
      label: "Gasto medio diario",
      value: formatCurrency(kpis.averageDailyExpenseCents),
      helper: "Saidas divididas pelos dias do periodo.",
      accent: "bg-amber-50 text-amber-700",
      icon: <TrendingDown className="size-5" aria-hidden="true" />,
    },
    {
      label: "Maior saida",
      value: largestExpense ? formatCurrency(largestExpense.amountCents) : "Sem saidas",
      helper: largestExpense ? truncateText(largestExpense.description, 42) : "Nenhuma saida no periodo.",
      accent: "bg-violet-50 text-violet-700",
      icon: <WalletCards className="size-5" aria-hidden="true" />,
    },
    {
      label: "Transacoes",
      value: String(kpis.transactionCount),
      helper: "Itens considerados no periodo.",
      accent: "bg-teal-50 text-brand-teal",
      icon: <ListChecks className="size-5" aria-hidden="true" />,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </section>
  );
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}...`;
}
