import type { CategorizationSource, TransactionDirection } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  buildDashboardKpiComparisons,
  buildDashboardOffenders,
  buildDashboardTimeSeries,
  calculateCategoryAnalytics,
  calculateFinancialKpis,
  compareDashboardMetric,
  groupDashboardCategories,
  MONTHLY_GRANULARITY_THRESHOLD_DAYS,
  resolveDashboardChartGranularity,
  UNIDENTIFIED_DESCRIPTION_LABEL,
} from "@/lib/dashboard/dashboard-calculations";
import type {
  DashboardAnalyticsTransaction,
  DashboardDateRange,
  DashboardFinancialTransaction,
} from "@/lib/dashboard/dashboard-types";

function financialTransaction(
  id: string,
  direction: TransactionDirection,
  amountCents: number,
  occurredAt = "2026-08-05T12:00:00.000Z",
): DashboardFinancialTransaction {
  return { id, direction, amountCents, occurredAt: new Date(occurredAt) };
}

function analyticsTransaction(
  overrides: Partial<DashboardAnalyticsTransaction> & Pick<DashboardAnalyticsTransaction, "id">,
): DashboardAnalyticsTransaction {
  return {
    occurredAt: new Date("2026-08-05T12:00:00.000Z"),
    description: `Synthetic ${overrides.id}`,
    normalizedDescription: null,
    descriptionHash: null,
    amountCents: 100,
    direction: "EXPENSE",
    categoryId: null,
    categorizationSource: "IMPORTED" as CategorizationSource,
    category: null,
    ...overrides,
  };
}

function period(startInclusive: string, endExclusive: string, dayCount: number): DashboardDateRange {
  return {
    filter: "imported-period",
    startInclusive: new Date(startInclusive),
    endExclusive: new Date(endExclusive),
    dayCount,
  };
}

describe("financial KPI calculations", () => {
  it("uses direction as authority and absolute magnitude for income, including contradictory signs", () => {
    const kpis = calculateFinancialKpis([
      financialTransaction("income-positive", "INCOME", 1_000),
      financialTransaction("income-negative", "INCOME", -500),
    ]);

    expect(kpis).toEqual({
      totalIncomeCents: 1_500,
      totalExpenseCents: 0,
      periodResultCents: 1_500,
      averageExpenseCents: null,
      largestExpenseCents: null,
      includedTransactionCount: 2,
    });
  });

  it("calculates expenses, average per expense, largest expense, and a negative result", () => {
    const kpis = calculateFinancialKpis([
      financialTransaction("income", "INCOME", 100),
      financialTransaction("expense-negative", "EXPENSE", -600),
      financialTransaction("expense-positive", "EXPENSE", 200),
    ]);

    expect(kpis).toEqual({
      totalIncomeCents: 100,
      totalExpenseCents: 800,
      periodResultCents: -700,
      averageExpenseCents: 400,
      largestExpenseCents: 600,
      includedTransactionCount: 3,
    });
  });

  it("calculates an expense-only period without inventing income", () => {
    expect(
      calculateFinancialKpis([
        financialTransaction("expense-one", "EXPENSE", -125),
        financialTransaction("expense-two", "EXPENSE", 375),
      ]),
    ).toEqual({
      totalIncomeCents: 0,
      totalExpenseCents: 500,
      periodResultCents: -500,
      averageExpenseCents: 250,
      largestExpenseCents: 375,
      includedTransactionCount: 2,
    });
  });

  it("excludes transfers and reversals and counts a zero expense exactly once", () => {
    const kpis = calculateFinancialKpis([
      financialTransaction("transfer", "TRANSFER", -90_000),
      financialTransaction("reversal", "REVERSAL", 80_000),
      financialTransaction("zero-expense", "EXPENSE", 0),
      financialTransaction("zero-income", "INCOME", 0),
    ]);

    expect(kpis).toEqual({
      totalIncomeCents: 0,
      totalExpenseCents: 0,
      periodResultCents: 0,
      averageExpenseCents: 0,
      largestExpenseCents: 0,
      includedTransactionCount: 2,
    });
  });

  it("returns explicit absence for average and largest expense when there are no transactions", () => {
    expect(calculateFinancialKpis([])).toEqual({
      totalIncomeCents: 0,
      totalExpenseCents: 0,
      periodResultCents: 0,
      averageExpenseCents: null,
      largestExpenseCents: null,
      includedTransactionCount: 0,
    });
  });
});

describe("KPI comparisons", () => {
  it("calculates growth, reduction, unchanged values, and signed negative results", () => {
    expect(compareDashboardMetric(150, 100)).toEqual({
      currentValue: 150,
      previousValue: 100,
      absoluteChange: 50,
      percentageChange: 50,
      comparisonStatus: "INCREASE",
    });
    expect(compareDashboardMetric(50, 100).comparisonStatus).toBe("DECREASE");
    expect(compareDashboardMetric(100, 100).comparisonStatus).toBe("UNCHANGED");
    expect(compareDashboardMetric(-50, -100)).toEqual({
      currentValue: -50,
      previousValue: -100,
      absoluteChange: 50,
      percentageChange: 50,
      comparisonStatus: "INCREASE",
    });
  });

  it("preserves a useful absolute change but has no percentage basis for zero or missing prior values", () => {
    expect(compareDashboardMetric(250, 0)).toEqual({
      currentValue: 250,
      previousValue: 0,
      absoluteChange: 250,
      percentageChange: null,
      comparisonStatus: "NO_BASIS",
    });
    expect(compareDashboardMetric(250, null)).toEqual({
      currentValue: 250,
      previousValue: null,
      absoluteChange: null,
      percentageChange: null,
      comparisonStatus: "NO_BASIS",
    });
    expect(compareDashboardMetric(null, 100).comparisonStatus).toBe("NO_BASIS");
  });

  it("builds every comparable KPI without NaN or Infinity", () => {
    const current = calculateFinancialKpis([financialTransaction("current-expense", "EXPENSE", 300)]);
    const comparisons = buildDashboardKpiComparisons(current, calculateFinancialKpis([]));
    const serialized = JSON.stringify(comparisons);

    expect(comparisons.totalExpenseCents.comparisonStatus).toBe("NO_BASIS");
    expect(comparisons.averageExpenseCents.percentageChange).toBeNull();
    expect(serialized).not.toContain("NaN");
    expect(serialized).not.toContain("Infinity");
  });
});

describe("dashboard time series", () => {
  it("creates ordered daily buckets, preserves empty dates, and reconciles cumulative result", () => {
    const selectedPeriod = period("2026-01-01T00:00:00.000Z", "2026-01-04T00:00:00.000Z", 3);
    const transactions = [
      financialTransaction("income", "INCOME", -1_000, "2026-01-01T06:00:00.000Z"),
      financialTransaction("expense", "EXPENSE", 400, "2026-01-03T22:00:00.000Z"),
      financialTransaction("transfer", "TRANSFER", 9_000, "2026-01-02T12:00:00.000Z"),
      financialTransaction("reversal", "REVERSAL", -8_000, "2026-01-03T12:00:00.000Z"),
      financialTransaction("exclusive-boundary", "EXPENSE", 7_000, "2026-01-04T00:00:00.000Z"),
    ];

    const result = buildDashboardTimeSeries(selectedPeriod, transactions);

    expect(result.granularity).toBe("day");
    expect(result.points.map((point) => point.key)).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
    expect(result.points.map((point) => ({
      income: point.incomeCents,
      expense: point.expenseCents,
      result: point.periodResultCents,
      cumulative: point.cumulativeResultCents,
      count: point.transactionCount,
    }))).toEqual([
      { income: 1_000, expense: 0, result: 1_000, cumulative: 1_000, count: 1 },
      { income: 0, expense: 0, result: 0, cumulative: 1_000, count: 0 },
      { income: 0, expense: 400, result: -400, cumulative: 600, count: 1 },
    ]);
    expect(result.points.at(-1)?.cumulativeResultCents).toBe(calculateFinancialKpis(transactions.slice(0, 4)).periodResultCents);
  });

  it("creates one valid point for one civil date with no movement", () => {
    const result = buildDashboardTimeSeries(
      period("2026-05-20T00:00:00.000Z", "2026-05-21T00:00:00.000Z", 1),
      [],
    );

    expect(result.points).toEqual([
      expect.objectContaining({
        key: "2026-05-20",
        incomeCents: 0,
        expenseCents: 0,
        periodResultCents: 0,
        cumulativeResultCents: 0,
      }),
    ]);
  });

  it("uses a centralized monthly threshold and respects partial boundary months", () => {
    const selectedPeriod = period("2026-01-15T00:00:00.000Z", "2026-05-01T00:00:00.000Z", 106);
    const result = buildDashboardTimeSeries(selectedPeriod, [
      financialTransaction("before", "INCOME", 9_999, "2026-01-14T23:59:59.999Z"),
      financialTransaction("january", "EXPENSE", 100, "2026-01-15T00:00:00.000Z"),
      financialTransaction("april", "INCOME", 500, "2026-04-30T23:59:59.999Z"),
    ]);

    expect(MONTHLY_GRANULARITY_THRESHOLD_DAYS).toBe(92);
    expect(resolveDashboardChartGranularity(92)).toBe("day");
    expect(resolveDashboardChartGranularity(93)).toBe("month");
    expect(result.granularity).toBe("month");
    expect(result.points.map((point) => point.key)).toEqual(["2026-01", "2026-02", "2026-03", "2026-04"]);
    expect(result.points[0]).toEqual(expect.objectContaining({
      startInclusive: "2026-01-15T00:00:00.000Z",
      expenseCents: 100,
    }));
    expect(result.points.at(-1)).toEqual(expect.objectContaining({
      endExclusive: "2026-05-01T00:00:00.000Z",
      cumulativeResultCents: 400,
    }));
  });
});

describe("category analytics and reconciliation", () => {
  it("rolls child expenses into the root, preserves manual input, and keeps uncategorized separate", () => {
    const manualExpense = analyticsTransaction({
      id: "manual-child",
      amountCents: -400,
      categoryId: "child-food",
      categorizationSource: "USER_MANUAL" as CategorizationSource,
      category: {
        id: "child-food",
        name: "Mercado",
        parent: { id: "root-food", name: "Alimentacao" },
      },
    });
    const transactions = [
      analyticsTransaction({
        id: "root-expense",
        amountCents: 600,
        categoryId: "root-food",
        category: { id: "root-food", name: "Alimentacao", parent: null },
      }),
      manualExpense,
      analyticsTransaction({ id: "uncategorized", amountCents: 500 }),
      analyticsTransaction({
        id: "categorized-income",
        direction: "INCOME",
        amountCents: 9_000,
        categoryId: "root-food",
        category: { id: "root-food", name: "Alimentacao", parent: null },
      }),
      analyticsTransaction({ id: "ignored-transfer", direction: "TRANSFER", amountCents: 7_000 }),
    ];
    const manualBefore = structuredClone(manualExpense);

    const analytics = calculateCategoryAnalytics(transactions);

    expect(analytics.rootCategories).toEqual([
      expect.objectContaining({
        rootCategoryId: "root-food",
        rootCategoryName: "Alimentacao",
        amountCents: 1_000,
        transactionCount: 2,
      }),
    ]);
    expect(analytics.uncategorized).toEqual(expect.objectContaining({
      label: "Sem categoria",
      amountCents: 500,
      transactionCount: 1,
    }));
    expect(analytics.coverage).toEqual(expect.objectContaining({
      totalExpenseCents: 1_500,
      totalExpenseCount: 3,
      categorizedExpenseCents: 1_000,
      categorizedExpenseCount: 2,
      uncategorizedExpenseCents: 500,
      uncategorizedExpenseCount: 1,
    }));
    expect(analytics.coverage.amountCoveragePercentage).toBeCloseTo(1000 / 15);
    expect(analytics.coverage.countCoveragePercentage).toBeCloseTo(200 / 3);
    expect(manualExpense).toEqual(manualBefore);
    expect(
      analytics.rootCategories.reduce((total, category) => total + category.amountCents, 0) +
        analytics.uncategorized.amountCents,
    ).toBe(analytics.coverage.totalExpenseCents);
  });

  it("returns absent coverage basis when there are no expenses", () => {
    const analytics = calculateCategoryAnalytics([
      analyticsTransaction({ id: "income", direction: "INCOME", amountCents: 500 }),
    ]);

    expect(analytics.rootCategories).toEqual([]);
    expect(analytics.topCategory).toBeNull();
    expect(analytics.coverage).toEqual(expect.objectContaining({
      totalExpenseCents: 0,
      totalExpenseCount: 0,
      amountCoveragePercentage: null,
      countCoveragePercentage: null,
    }));
  });

  it("groups a configurable overflow deterministically without absorbing uncategorized expenses", () => {
    const analytics = calculateCategoryAnalytics([
      analyticsTransaction({
        id: "beta",
        amountCents: 500,
        categoryId: "root-b",
        category: { id: "root-b", name: "Beta", parent: null },
      }),
      analyticsTransaction({
        id: "alpha",
        amountCents: 500,
        categoryId: "root-a",
        category: { id: "root-a", name: "Alpha", parent: null },
      }),
      analyticsTransaction({
        id: "gamma-1",
        amountCents: 250,
        categoryId: "root-g",
        category: { id: "root-g", name: "Gamma", parent: null },
      }),
      analyticsTransaction({
        id: "gamma-2",
        amountCents: 250,
        categoryId: "root-g",
        category: { id: "root-g", name: "Gamma", parent: null },
      }),
      analyticsTransaction({ id: "uncategorized", amountCents: 125 }),
    ]);
    const grouped = groupDashboardCategories(analytics, 2);

    expect(analytics.rootCategories.map((category) => category.rootCategoryId)).toEqual([
      "root-g",
      "root-a",
      "root-b",
    ]);
    expect(grouped.visibleCategories.map((category) => category.rootCategoryId)).toEqual(["root-g", "root-a"]);
    expect(grouped.other).toEqual(expect.objectContaining({
      label: "Outros",
      amountCents: 500,
      transactionCount: 1,
      target: { kind: "ROOT_CATEGORY_SET", rootCategoryIds: ["root-b"] },
    }));
    expect(grouped.uncategorized.amountCents).toBe(125);
    expect(
      grouped.visibleCategories.reduce((total, category) => total + category.amountCents, 0) +
        (grouped.other?.amountCents ?? 0) +
        grouped.uncategorized.amountCents,
    ).toBe(analytics.coverage.totalExpenseCents);
    expect(groupDashboardCategories(analytics, 3).other).toBeNull();
    expect(() => groupDashboardCategories(analytics, -1)).toThrow(RangeError);
  });
});

describe("expense offenders", () => {
  it("builds deterministic expense-only rankings and preserves typed drill-through targets", () => {
    const transactions = [
      analyticsTransaction({
        id: "coffee-1",
        occurredAt: new Date("2026-08-05T10:00:00.000Z"),
        description: "Synthetic Coffee One",
        normalizedDescription: "Zulu Cafe Central",
        descriptionHash: "a".repeat(64),
        amountCents: -500,
        categoryId: "root-food",
        category: { id: "root-food", name: "Alimentacao", parent: null },
      }),
      analyticsTransaction({
        id: "coffee-2",
        occurredAt: new Date("2026-08-05T11:00:00.000Z"),
        description: "Synthetic Coffee Two",
        normalizedDescription: "Alpha Cafe Central",
        descriptionHash: "a".repeat(64),
        amountCents: 300,
        categoryId: "root-food",
        category: { id: "root-food", name: "Alimentacao", parent: null },
      }),
      analyticsTransaction({
        id: "unidentified",
        occurredAt: new Date("2026-08-06T10:00:00.000Z"),
        description: "Synthetic Unidentified",
        amountCents: 800,
      }),
      analyticsTransaction({
        id: "income",
        direction: "INCOME",
        normalizedDescription: "Private income description",
        descriptionHash: "income-hash",
        amountCents: 90_000,
      }),
      analyticsTransaction({ id: "transfer", direction: "TRANSFER", amountCents: 80_000 }),
      analyticsTransaction({ id: "reversal", direction: "REVERSAL", amountCents: 70_000 }),
    ];
    const categories = calculateCategoryAnalytics(transactions);
    const offenders = buildDashboardOffenders(transactions, categories, {
      largestExpenses: 10,
      normalizedDescriptions: 10,
      expenseDays: 10,
    });

    expect(offenders.largestExpenses.map(({ id, amountCents }) => ({ id, amountCents }))).toEqual([
      { id: "unidentified", amountCents: 800 },
      { id: "coffee-1", amountCents: 500 },
      { id: "coffee-2", amountCents: 300 },
    ]);
    expect(offenders.largestExpenses[0].target).toEqual({
      kind: "TRANSACTION",
      transactionId: "unidentified",
    });
    expect(offenders.topNormalizedDescriptions).toEqual([
      expect.objectContaining({
        key: "description-group:coffee-1",
        label: "Alpha Cafe Central",
        amountCents: 800,
        transactionCount: 2,
        target: {
          kind: "NORMALIZED_DESCRIPTION",
          descriptionHash: "a".repeat(64),
          normalizedDescription: "Alpha Cafe Central",
        },
      }),
      expect.objectContaining({
        key: "description-group:unidentified",
        label: UNIDENTIFIED_DESCRIPTION_LABEL,
        amountCents: 800,
        transactionCount: 1,
        target: { kind: "UNIDENTIFIED_DESCRIPTION" },
      }),
    ]);
    expect(offenders.topCategory).toEqual(categories.topCategory);
    expect(offenders.topExpenseDays).toEqual([
      expect.objectContaining({
        date: "2026-08-05",
        amountCents: 800,
        transactionCount: 2,
        target: { kind: "DAY", date: "2026-08-05" },
      }),
      expect.objectContaining({ date: "2026-08-06", amountCents: 800, transactionCount: 1 }),
    ]);
    expect(JSON.stringify(offenders)).not.toContain("Private income description");
    expect(JSON.stringify(offenders)).not.toContain("income-hash");
  });

  it("uses deterministic tie breakers and configurable limits", () => {
    const transactions = [
      analyticsTransaction({ id: "expense-b", occurredAt: new Date("2026-08-02T12:00:00.000Z"), amountCents: 100 }),
      analyticsTransaction({ id: "expense-a", occurredAt: new Date("2026-08-02T12:00:00.000Z"), amountCents: 100 }),
    ];
    const offenders = buildDashboardOffenders(transactions, calculateCategoryAnalytics(transactions), {
      largestExpenses: 1,
      normalizedDescriptions: 0,
      expenseDays: 0,
    });

    expect(offenders.largestExpenses.map((expense) => expense.id)).toEqual(["expense-a"]);
    expect(offenders.topNormalizedDescriptions).toEqual([]);
    expect(offenders.topExpenseDays).toEqual([]);
  });

  it("orders tied expense days by their UTC civil date", () => {
    const transactions = [
      analyticsTransaction({
        id: "later-day",
        occurredAt: new Date("2026-08-03T12:00:00.000Z"),
        amountCents: 100,
      }),
      analyticsTransaction({
        id: "earlier-day",
        occurredAt: new Date("2026-08-02T12:00:00.000Z"),
        amountCents: 100,
      }),
    ];
    const offenders = buildDashboardOffenders(transactions, calculateCategoryAnalytics(transactions), {
      largestExpenses: 0,
      normalizedDescriptions: 0,
      expenseDays: 2,
    });

    expect(offenders.topExpenseDays.map((day) => day.date)).toEqual(["2026-08-02", "2026-08-03"]);
  });
});
