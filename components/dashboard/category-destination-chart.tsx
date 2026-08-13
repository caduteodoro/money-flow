import Link from "next/link";

import { EChartsClient } from "@/components/dashboard/echarts-client";
import { LinkButton } from "@/components/ui/button";
import type {
  DashboardCategoryDestinationModel,
  DashboardDateFilterId,
} from "@/lib/dashboard/dashboard-types";
import {
  formatDashboardCurrency,
  formatDashboardPercentage,
} from "@/lib/dashboard/dashboard-visualization";
import { buildDashboardDrillThroughUrl, buildTransactionsUrl } from "@/lib/transactions";

type CategoryDestinationChartProps = {
  activeFilter: DashboardDateFilterId;
  model: DashboardCategoryDestinationModel;
};

export function CategoryDestinationChart({ activeFilter, model }: CategoryDestinationChartProps) {
  if (model.totalExpenseCents === 0) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-brand-navy">Não há despesas para compor este gráfico.</p>
          <p className="mt-1 text-sm text-slate-600">O destino por categoria fica sem base até existir uma saída no período.</p>
        </div>
        <LinkButton href={buildTransactionsUrl({ period: activeFilter, direction: "EXPENSE" })} variant="secondary">Ver saídas</LinkButton>
      </div>
    );
  }

  const items = model.items.map((item) => ({
    ...item,
    href: buildDashboardDrillThroughUrl(item.target, activeFilter),
  }));

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-start">
      <EChartsClient
        ariaLabel="Gráfico horizontal do destino das despesas por categoria raiz"
        className="h-72 sm:h-80"
        kind="categories"
        links={items.map((item) => item.href)}
        model={model}
      />

      <div>
        <p className="text-xs leading-5 text-slate-500">
          Total reconciliado: {formatDashboardCurrency(model.totalExpenseCents)}. Categorias filhas são
          consolidadas na categoria raiz.
        </p>
        <ol className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/70">
          {items.map((item, index) => (
            <li className="flex min-w-0 items-center gap-3 px-3 py-3" key={item.key}>
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-slate-500">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                {item.href ? (
                  <Link
                    className="block break-words text-sm font-bold text-brand-navy underline-offset-4 hover:text-brand-teal hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                    href={item.href}
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="block break-words text-sm font-bold text-brand-navy" title={item.label}>
                    {item.label}
                  </span>
                )}
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.transactionCount} {item.transactionCount === 1 ? "despesa" : "despesas"}
                  {item.kind === "OTHER" ? " · agregado sem drill-through" : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-brand-navy">
                  {formatDashboardCurrency(item.amountCents)}
                </p>
                <p className="text-xs tabular-nums text-slate-500">
                  {formatDashboardPercentage(item.percentage)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
