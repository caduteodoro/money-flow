import { describe, expect, it } from "vitest";

import type { DashboardCategoryAnalytics, DashboardTimeSeriesPoint } from "@/lib/dashboard/dashboard-types";
import {
  buildCategoryDestinationOption,
  buildDashboardCategoryDestinationModel,
  buildDashboardEvolutionChartModel,
  buildFinancialEvolutionOption,
} from "@/lib/dashboard/dashboard-visualization";

const points: DashboardTimeSeriesPoint[] = [
  {
    key: "2026-08-01",
    label: "01/08",
    startInclusive: "2026-08-01T00:00:00.000Z",
    endExclusive: "2026-08-02T00:00:00.000Z",
    incomeCents: 1_000,
    expenseCents: 0,
    periodResultCents: 1_000,
    cumulativeResultCents: 1_000,
    transactionCount: 1,
  },
  {
    key: "2026-08-02",
    label: "02/08",
    startInclusive: "2026-08-02T00:00:00.000Z",
    endExclusive: "2026-08-03T00:00:00.000Z",
    incomeCents: 0,
    expenseCents: 0,
    periodResultCents: 0,
    cumulativeResultCents: 1_000,
    transactionCount: 0,
  },
  {
    key: "2026-08-03",
    label: "03/08",
    startInclusive: "2026-08-03T00:00:00.000Z",
    endExclusive: "2026-08-04T00:00:00.000Z",
    incomeCents: 0,
    expenseCents: 1_500,
    periodResultCents: -1_500,
    cumulativeResultCents: -500,
    transactionCount: 1,
  },
];

const categoryAnalytics: DashboardCategoryAnalytics = {
  rootCategories: [
    rootCategory("home", "Moradia", 5_000, 2),
    rootCategory("food", "Alimentação", 3_000, 3),
    rootCategory("transport", "Transporte", 1_000, 1),
  ],
  uncategorized: {
    kind: "UNCATEGORIZED",
    label: "Sem categoria",
    amountCents: 1_000,
    transactionCount: 1,
    target: { kind: "UNCATEGORIZED" },
  },
  coverage: {
    totalExpenseCents: 10_000,
    totalExpenseCount: 7,
    categorizedExpenseCents: 9_000,
    categorizedExpenseCount: 6,
    uncategorizedExpenseCents: 1_000,
    uncategorizedExpenseCount: 1,
    amountCoveragePercentage: 90,
    countCoveragePercentage: 600 / 7,
  },
  topCategory: rootCategory("home", "Moradia", 5_000, 2),
};

describe("dashboard visualization models", () => {
  it("preserves empty evolution buckets, zero values, and a negative cumulative result", () => {
    const model = buildDashboardEvolutionChartModel(points);

    expect(model).toEqual({
      labels: ["01/08", "02/08", "03/08"],
      incomeCents: [1_000, 0, 0],
      expenseCents: [0, 0, 1_500],
      cumulativeResultCents: [1_000, 1_000, -500],
    });
  });

  it("groups category overflow deterministically and never absorbs uncategorized expenses into Outros", () => {
    const model = buildDashboardCategoryDestinationModel(categoryAnalytics, 2);

    expect(model.items.map(({ kind, label, amountCents, percentage }) => ({ kind, label, amountCents, percentage }))).toEqual([
      { kind: "ROOT_CATEGORY", label: "Moradia", amountCents: 5_000, percentage: 50 },
      { kind: "ROOT_CATEGORY", label: "Alimentação", amountCents: 3_000, percentage: 30 },
      { kind: "OTHER", label: "Outros", amountCents: 1_000, percentage: 10 },
      { kind: "UNCATEGORIZED", label: "Sem categoria", amountCents: 1_000, percentage: 10 },
    ]);
    expect(model.items.reduce((total, item) => total + item.amountCents, 0)).toBe(model.totalExpenseCents);
    expect(model.items.find((item) => item.kind === "OTHER")?.target).toEqual({
      kind: "ROOT_CATEGORY_SET",
      rootCategoryIds: ["transport"],
    });
  });
});

describe("dashboard ECharts configuration", () => {
  it("uses bars and a cumulative line on one shared money axis with safe rich-text tooltip and ARIA", () => {
    const option = buildFinancialEvolutionOption(buildDashboardEvolutionChartModel(points), false) as Record<string, unknown>;
    const series = option.series as Array<Record<string, unknown>>;

    expect(option.animation).toBe(false);
    expect(option).toMatchObject({ aria: { enabled: true, decal: { show: true } }, tooltip: { renderMode: "richText" } });
    expect(option).toMatchObject({ grid: { outerBoundsMode: "same", outerBoundsContain: "axisLabel" } });
    expect(series.map((item) => item.type)).toEqual(["bar", "bar", "line"]);
    expect(series[1]?.data).toEqual([0, 0, -1_500]);
    expect(option).toHaveProperty("yAxis");
    expect(JSON.stringify(option)).not.toContain("sankey");
  });

  it("builds a horizontal category bar chart with distinct semantic colors", () => {
    const model = buildDashboardCategoryDestinationModel(categoryAnalytics, 2);
    const option = buildCategoryDestinationOption(model, true) as Record<string, unknown>;
    const series = option.series as Array<{ type: string; data: Array<{ itemStyle: { color: string } }> }>;

    expect(option).toMatchObject({
      animation: true,
      aria: { enabled: true, decal: { show: true } },
      tooltip: { renderMode: "richText" },
      grid: { outerBoundsMode: "same", outerBoundsContain: "axisLabel" },
      xAxis: { type: "value", splitNumber: 3, axisLabel: { hideOverlap: true } },
      yAxis: { type: "category", inverse: true },
    });
    expect(series[0]?.type).toBe("bar");
    expect(series[0]?.data.map((item) => item.itemStyle.color)).toEqual([
      "#0f766e",
      "#0f766e",
      "#64748b",
      "#d97706",
    ]);
  });
});

function rootCategory(id: string, name: string, amountCents: number, transactionCount: number) {
  return {
    kind: "ROOT_CATEGORY" as const,
    rootCategoryId: id,
    rootCategoryName: name,
    amountCents,
    transactionCount,
    target: { kind: "ROOT_CATEGORY" as const, rootCategoryId: id },
  };
}
