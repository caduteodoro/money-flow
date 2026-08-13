import type {
  DashboardCategoryAnalytics,
  DashboardCategoryDestinationModel,
  DashboardEvolutionChartModel,
  DashboardTimeSeriesPoint,
} from "@/lib/dashboard/dashboard-types";
import { groupDashboardCategories } from "@/lib/dashboard/dashboard-calculations";
import type { EChartsCoreOption } from "echarts/core";

export const DASHBOARD_VISIBLE_CATEGORY_LIMIT = 5;

export function buildDashboardEvolutionChartModel(
  points: readonly DashboardTimeSeriesPoint[],
): DashboardEvolutionChartModel {
  return {
    labels: points.map((point) => point.label),
    incomeCents: points.map((point) => point.incomeCents),
    expenseCents: points.map((point) => point.expenseCents),
    cumulativeResultCents: points.map((point) => point.cumulativeResultCents),
  };
}

export function buildDashboardCategoryDestinationModel(
  analytics: DashboardCategoryAnalytics,
  visibleCategoryLimit = DASHBOARD_VISIBLE_CATEGORY_LIMIT,
): DashboardCategoryDestinationModel {
  const grouped = groupDashboardCategories(analytics, visibleCategoryLimit);
  const items = [
    ...grouped.visibleCategories.map((category) => ({
      key: `category:${category.rootCategoryId}`,
      kind: category.kind,
      label: category.rootCategoryName,
      amountCents: category.amountCents,
      transactionCount: category.transactionCount,
      target: category.target,
    })),
    ...(grouped.other
      ? [
          {
            key: "other",
            kind: grouped.other.kind,
            label: grouped.other.label,
            amountCents: grouped.other.amountCents,
            transactionCount: grouped.other.transactionCount,
            target: grouped.other.target,
          },
        ]
      : []),
    ...(grouped.uncategorized.amountCents > 0
      ? [
          {
            key: "uncategorized",
            kind: grouped.uncategorized.kind,
            label: grouped.uncategorized.label,
            amountCents: grouped.uncategorized.amountCents,
            transactionCount: grouped.uncategorized.transactionCount,
            target: grouped.uncategorized.target,
          },
        ]
      : []),
  ];
  const reconciledExpenseCents = items.reduce((total, item) => total + item.amountCents, 0);

  if (reconciledExpenseCents !== analytics.coverage.totalExpenseCents) {
    throw new Error("O destino por categoria nao reconciliou com o total de despesas.");
  }

  return {
    totalExpenseCents: analytics.coverage.totalExpenseCents,
    items: items.map((item) => ({
      ...item,
      percentage:
        analytics.coverage.totalExpenseCents > 0
          ? (item.amountCents / analytics.coverage.totalExpenseCents) * 100
          : 0,
    })),
  };
}

export function buildFinancialEvolutionOption(
  model: DashboardEvolutionChartModel,
  animation: boolean,
): EChartsCoreOption {
  return {
    animation,
    color: ["#059669", "#e11d48", "#0369a1"],
    aria: {
      enabled: true,
      decal: { show: true },
      description:
        "Evolução financeira do período. Barras verdes representam entradas, barras vermelhas representam saídas e a linha azul representa o resultado acumulado.",
    },
    grid: {
      left: 8,
      right: 12,
      top: 36,
      bottom: 8,
      outerBoundsMode: "same",
      outerBoundsContain: "axisLabel",
    },
    legend: {
      top: 0,
      left: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: "#475569", fontSize: 12 },
    },
    tooltip: {
      trigger: "axis",
      renderMode: "richText",
      confine: true,
      valueFormatter: (value: unknown) => formatCurrency(Number(value)),
    },
    xAxis: {
      type: "category",
      data: model.labels,
      axisLine: { lineStyle: { color: "#cbd5e1" } },
      axisTick: { show: false },
      axisLabel: { color: "#64748b", hideOverlap: true, fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#64748b",
        formatter: (value: number) => formatCompactCurrency(value),
      },
      splitLine: { lineStyle: { color: "#e2e8f0", type: "dashed" } },
    },
    series: [
      {
        name: "Entradas",
        type: "bar",
        data: model.incomeCents,
        barMaxWidth: 22,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        emphasis: { focus: "series" },
      },
      {
        name: "Saídas",
        type: "bar",
        data: model.expenseCents.map((value) => (value === 0 ? 0 : -value)),
        barMaxWidth: 22,
        itemStyle: { borderRadius: [0, 0, 4, 4] },
        emphasis: { focus: "series" },
      },
      {
        name: "Resultado acumulado",
        type: "line",
        data: model.cumulativeResultCents,
        symbol: "circle",
        symbolSize: 7,
        smooth: false,
        lineStyle: { width: 3 },
        emphasis: { focus: "series" },
      },
    ],
  };
}

export function buildCategoryDestinationOption(
  model: DashboardCategoryDestinationModel,
  animation: boolean,
): EChartsCoreOption {
  return {
    animation,
    aria: {
      enabled: true,
      decal: { show: true },
      description:
        "Destino das despesas por categoria raiz. Outros agrega categorias menores e Sem categoria permanece separado.",
    },
    grid: {
      left: 8,
      right: 16,
      top: 8,
      bottom: 8,
      outerBoundsMode: "same",
      outerBoundsContain: "axisLabel",
    },
    tooltip: {
      trigger: "item",
      renderMode: "richText",
      confine: true,
      formatter: (params: { name?: string; value?: unknown; dataIndex?: number }) => {
        const item = model.items[params.dataIndex ?? -1];
        if (!item) return "";
        return `${item.label}\n${formatCurrency(item.amountCents)} · ${formatPercentage(item.percentage)}`;
      },
    },
    xAxis: {
      type: "value",
      splitNumber: 3,
      axisLabel: {
        color: "#64748b",
        hideOverlap: true,
        formatter: (value: number) => formatCompactCurrency(value),
      },
      splitLine: { lineStyle: { color: "#e2e8f0", type: "dashed" } },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: model.items.map((item) => item.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#334155", width: 132, overflow: "truncate", fontSize: 11 },
    },
    series: [
      {
        name: "Despesas",
        type: "bar",
        barMaxWidth: 24,
        data: model.items.map((item) => ({
          value: item.amountCents,
          itemStyle: {
            color:
              item.kind === "UNCATEGORIZED"
                ? "#d97706"
                : item.kind === "OTHER"
                  ? "#64748b"
                  : "#0f766e",
            borderRadius: [0, 5, 5, 0],
          },
        })),
        label: {
          show: true,
          position: "right",
          color: "#475569",
          fontSize: 11,
          formatter: (params: { dataIndex?: number }) => {
            const item = model.items[params.dataIndex ?? -1];
            return item ? formatPercentage(item.percentage) : "";
          },
        },
        emphasis: { focus: "series" },
      },
    ],
  };
}

export function formatDashboardCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

export function formatDashboardPercentage(value: number) {
  return formatPercentage(value);
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "Sem valor";
  return formatDashboardCurrency(Math.abs(value));
}

function formatCompactCurrency(value: number) {
  if (!Number.isFinite(value)) return "Sem valor";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value / 100);
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) return "Sem base";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}
