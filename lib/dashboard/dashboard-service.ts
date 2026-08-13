import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  buildDashboardKpiComparisons,
  buildDashboardOffenders,
  buildDashboardTimeSeries,
  calculateCategoryAnalytics,
  calculateFinancialKpis,
} from "@/lib/dashboard/dashboard-calculations";
import {
  resolveFixedDashboardDateRange,
  resolveImportedPeriodDateRange,
  resolvePreviousDashboardDateRange,
} from "@/lib/dashboard/date-filters";
import type {
  DashboardAnalyticsTransaction,
  DashboardCategoryAnalytics,
  DashboardDateFilterId,
  DashboardDateRange,
  DashboardFinancialTransaction,
  DashboardInsight,
  DashboardQueryParams,
  DashboardSummary,
  DashboardTransactionItem,
  DashboardOffenders,
} from "@/lib/dashboard/dashboard-types";

const DEFAULT_DASHBOARD_FILTER: DashboardDateFilterId = "imported-period";
const RECENT_TRANSACTIONS_LIMIT = 10;
const OFFENDER_LIMITS = {
  largestExpenses: 5,
  normalizedDescriptions: 5,
  expenseDays: 5,
} as const;

export async function getDashboardSummary(params: DashboardQueryParams): Promise<DashboardSummary> {
  if (!params.userId) {
    throw new Error("Usuario autenticado obrigatorio para consultar o dashboard.");
  }

  const dateFilter = params.dateFilter ?? DEFAULT_DASHBOARD_FILTER;
  const [period, totalTransactionCount] = await Promise.all([
    resolveUserDashboardDateRange(params.userId, dateFilter, params.now),
    prisma.transaction.count({
      where: {
        userId: params.userId,
      },
    }),
  ]);
  const hasImportedTransactions = totalTransactionCount > 0;
  const comparisonPeriod = resolvePreviousDashboardDateRange(period);

  if (
    !period.startInclusive ||
    !period.endExclusive ||
    !comparisonPeriod?.startInclusive ||
    !comparisonPeriod.endExclusive
  ) {
    return buildDashboardSummary(period, comparisonPeriod, [], [], hasImportedTransactions);
  }

  const comparisonStartInclusive = comparisonPeriod.startInclusive;
  const comparisonEndExclusive = comparisonPeriod.endExclusive;

  const [currentTransactions, previousTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: params.userId,
        occurredAt: {
          gte: period.startInclusive,
          lt: period.endExclusive,
        },
      },
      select: {
        id: true,
        occurredAt: true,
        description: true,
        normalizedDescription: true,
        descriptionHash: true,
        amountCents: true,
        direction: true,
        categoryId: true,
        categorizationSource: true,
        category: {
          select: {
            id: true,
            name: true,
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ occurredAt: "desc" }, { id: "asc" }],
    }),
    prisma.transaction.findMany({
      where: {
        userId: params.userId,
        occurredAt: {
          gte: comparisonStartInclusive,
          lt: comparisonEndExclusive,
        },
      },
      select: {
        id: true,
        occurredAt: true,
        amountCents: true,
        direction: true,
      },
    }),
  ]);

  return buildDashboardSummary(
    period,
    comparisonPeriod,
    currentTransactions,
    previousTransactions,
    hasImportedTransactions,
  );
}

export async function resolveUserDashboardDateRange(
  userId: string,
  filter: DashboardDateFilterId,
  now = new Date(),
): Promise<DashboardDateRange> {
  if (filter !== "imported-period") {
    return resolveFixedDashboardDateRange(filter, now);
  }

  const importedPeriod = await prisma.transaction.aggregate({
    where: {
      userId,
    },
    _min: {
      occurredAt: true,
    },
    _max: {
      occurredAt: true,
    },
  });

  return resolveImportedPeriodDateRange(importedPeriod._min.occurredAt, importedPeriod._max.occurredAt);
}

function buildDashboardSummary(
  period: DashboardDateRange,
  comparisonPeriod: DashboardDateRange | null,
  currentTransactions: DashboardAnalyticsTransaction[],
  previousTransactions: DashboardFinancialTransaction[],
  hasImportedTransactions: boolean,
): DashboardSummary {
  const kpis = calculateFinancialKpis(currentTransactions);
  const previousKpis = calculateFinancialKpis(previousTransactions);
  const categories = calculateCategoryAnalytics(currentTransactions);
  const offenders = buildDashboardOffenders(currentTransactions, categories, OFFENDER_LIMITS);
  const timeSeries = buildDashboardTimeSeries(period, currentTransactions);
  const largestExpense = offenders.largestExpenses[0] ?? null;
  const comparisons = buildDashboardKpiComparisons(
    kpis,
    previousKpis.includedTransactionCount > 0 ? previousKpis : null,
  );

  return {
    period,
    comparisonPeriod,
    hasImportedTransactions,
    kpis,
    comparisons,
    largestExpense: largestExpense
      ? {
          id: largestExpense.id,
          occurredAt: largestExpense.occurredAt,
          description: largestExpense.description,
          amountCents: largestExpense.amountCents,
        }
      : null,
    recentTransactions: buildRecentTransactions(currentTransactions),
    charts: {
      granularity: timeSeries.granularity,
      cashflow: timeSeries.points,
      incomeExpense: {
        incomeCents: kpis.totalIncomeCents,
        expenseCents: kpis.totalExpenseCents,
      },
    },
    categories,
    offenders,
    insights: buildDashboardInsights(categories, offenders),
  };
}

function buildRecentTransactions(transactions: DashboardAnalyticsTransaction[]): DashboardTransactionItem[] {
  return transactions.slice(0, RECENT_TRANSACTIONS_LIMIT).map((transaction) => ({
    id: transaction.id,
    occurredAt: transaction.occurredAt.toISOString(),
    description: transaction.description,
    direction: transaction.direction,
    amountCents: transaction.amountCents,
    category: transaction.category
      ? {
          id: transaction.category.id,
          name: transaction.category.name,
          rootCategoryId: transaction.category.parent?.id ?? transaction.category.id,
          rootCategoryName: transaction.category.parent?.name ?? transaction.category.name,
        }
      : null,
  }));
}

function buildDashboardInsights(
  categories: DashboardCategoryAnalytics,
  offenders: DashboardOffenders,
): DashboardInsight[] {
  if (categories.coverage.totalExpenseCount === 0) {
    return [];
  }

  const insights: DashboardInsight[] = [];

  if (categories.topCategory) {
    const percentage =
      categories.coverage.totalExpenseCents > 0
        ? (categories.topCategory.amountCents / categories.coverage.totalExpenseCents) * 100
        : 0;
    insights.push({
      id: "top-category-concentration",
      title: `${categories.topCategory.rootCategoryName} liderou as despesas`,
      description: `${formatPercentage(percentage)} do total de saídas ficou concentrado nessa categoria raiz.`,
      tone: "neutral",
      amountCents: categories.topCategory.amountCents,
      target: categories.topCategory.target,
    });
  }

  if (categories.uncategorized.amountCents > 0) {
    const percentage =
      (categories.uncategorized.amountCents / categories.coverage.totalExpenseCents) * 100;
    insights.push({
      id: "uncategorized-expenses",
      title: "Há despesas sem categoria",
      description: `${formatPercentage(percentage)} das saídas por valor ainda está separado como Sem categoria.`,
      tone: "warning",
      amountCents: categories.uncategorized.amountCents,
      target: categories.uncategorized.target,
    });
  }

  const topExpenseDay = offenders.topExpenseDays[0];
  if (topExpenseDay) {
    insights.push({
      id: "top-expense-day",
      title: "Dia com maior volume de saídas",
      description: `${formatDate(topExpenseDay.date)} reuniu ${topExpenseDay.transactionCount} ${topExpenseDay.transactionCount === 1 ? "despesa" : "despesas"}.`,
      tone: "neutral",
      amountCents: topExpenseDay.amountCents,
      target: topExpenseDay.target,
    });
  }

  return insights;
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
