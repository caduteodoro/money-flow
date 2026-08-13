import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

import type { DashboardMetricComparison } from "@/lib/dashboard/dashboard-types";

type KpiCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  accent: string;
  comparison: DashboardMetricComparison;
  favorableDirection: "up" | "down" | "neutral";
  actionHref?: string;
  actionLabel?: string;
};

export function KpiCard({
  label,
  value,
  helper,
  icon,
  accent,
  comparison,
  favorableDirection,
  actionHref,
  actionLabel,
}: KpiCardProps) {
  const comparisonView = formatComparison(comparison, favorableDirection);

  return (
    <article className="group min-w-0 rounded-xl border border-slate-200/80 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-[0_20px_50px_rgba(15,23,42,0.10)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-3 break-words text-[clamp(1.35rem,2.2vw,1.8rem)] font-bold leading-tight tabular-nums text-brand-navy">
            {value}
          </p>
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${accent}`}>{icon}</span>
      </div>
      <p className="mt-3 min-h-10 text-sm leading-5 text-slate-500">{helper}</p>
      <div className={`mt-3 flex min-h-10 items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold ${comparisonView.className}`}>
        {comparisonView.icon}
        <span>{comparisonView.label}</span>
      </div>
      {actionHref && actionLabel ? (
        <Link
          className="mt-2 inline-flex min-h-10 items-center text-sm font-bold text-brand-teal underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </article>
  );
}

function formatComparison(
  comparison: DashboardMetricComparison,
  favorableDirection: "up" | "down" | "neutral",
) {
  if (comparison.comparisonStatus === "NO_BASIS" || comparison.percentageChange === null) {
    return {
      label: "Sem base comparável no período anterior",
      className: "bg-slate-50 text-slate-600",
      icon: <Minus className="size-4 shrink-0" aria-hidden="true" />,
    };
  }

  if (comparison.comparisonStatus === "UNCHANGED") {
    return {
      label: "Sem variação vs. período anterior",
      className: "bg-slate-50 text-slate-600",
      icon: <Minus className="size-4 shrink-0" aria-hidden="true" />,
    };
  }

  const increased = comparison.comparisonStatus === "INCREASE";
  const favorable =
    favorableDirection === "neutral" ||
    (favorableDirection === "up" && increased) ||
    (favorableDirection === "down" && !increased);
  const percentage = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(
    Math.abs(comparison.percentageChange),
  );

  return {
    label: `${increased ? "Aumento" : "Redução"} de ${percentage}% vs. período anterior`,
    className: favorable ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900",
    icon: increased ? (
      <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
    ) : (
      <ArrowDownRight className="size-4 shrink-0" aria-hidden="true" />
    ),
  };
}
