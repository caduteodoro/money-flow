import Link from "next/link";

import { EChartsClient } from "@/components/dashboard/echarts-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <Alert className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <AlertTitle>Não há valor de saída para compor este gráfico.</AlertTitle>
          <AlertDescription>O destino por categoria fica sem base enquanto o total de saídas do período for zero.</AlertDescription>
        </div>
        <LinkButton href={buildTransactionsUrl({ period: activeFilter, direction: "EXPENSE" })} variant="outline">
          Ver saídas
        </LinkButton>
      </Alert>
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
        <p className="text-xs leading-5 text-muted-foreground">
          Total reconciliado: {formatDashboardCurrency(model.totalExpenseCents)}. Categorias filhas são
          consolidadas na categoria raiz.
        </p>
        <ol className="mt-3 divide-y rounded-xl border bg-muted/30">
          {items.map((item, index) => (
            <li className="flex min-w-0 items-center gap-3 px-3 py-3" key={item.key}>
              <Badge className="size-7 shrink-0 justify-center rounded-full p-0" variant="outline">
                {index + 1}
              </Badge>
              <div className="min-w-0 flex-1">
                {item.href ? (
                  <Link
                    className="block break-words text-sm font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={item.href}
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="block break-words text-sm font-semibold text-foreground" title={item.label}>
                    {item.label}
                  </span>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.transactionCount} {item.transactionCount === 1 ? "despesa" : "despesas"}
                  {item.kind === "OTHER" ? " · agregado sem drill-through" : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatDashboardCurrency(item.amountCents)}
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">
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
