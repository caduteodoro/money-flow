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
  DashboardDateFilterId,
  DashboardDateRange,
  DashboardFinancialTransaction,
  DashboardInsight,
  DashboardQueryParams,
  DashboardSummary,
  DashboardTransactionItem,
  FinancialKpis,
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

  return {
    period,
    comparisonPeriod,
    hasImportedTransactions,
    kpis,
    comparisons: buildDashboardKpiComparisons(
      kpis,
      previousKpis.includedTransactionCount > 0 ? previousKpis : null,
    ),
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
    insights: buildDashboardInsights(kpis, largestExpense),
  };
}

function buildRecentTransactions(transactions: DashboardAnalyticsTransaction[]): DashboardTransactionItem[] {
  return transactions.slice(0, RECENT_TRANSACTIONS_LIMIT).map((transaction) => ({
    id: transaction.id,
    occurredAt: transaction.occurredAt.toISOString(),
    description: transaction.description,
    direction: transaction.direction,
    amountCents: transaction.amountCents,
  }));
}

function buildDashboardInsights(
  kpis: FinancialKpis,
  largestExpense: DashboardSummary["offenders"]["largestExpenses"][number] | null,
): DashboardInsight[] {
  if (kpis.includedTransactionCount === 0) {
    return [];
  }

  const insights: DashboardInsight[] = [];

  if (largestExpense) {
    insights.push({
      id: "largest-expense",
      title: "Maior gasto do periodo",
      description: "A maior saida registrada ajuda a entender onde o fluxo mais pesou.",
      tone: "neutral",
      amountCents: largestExpense.amountCents,
      target: largestExpense.target,
    });
  }

  insights.push({
    id: "income-expense-result",
    title: kpis.totalExpenseCents > kpis.totalIncomeCents ? "Saidas acima das entradas" : "Entradas cobriram as saidas",
    description:
      kpis.totalExpenseCents > kpis.totalIncomeCents
        ? "O periodo fechou com mais saidas do que entradas. Vale acompanhar a rota nos proximos lancamentos."
        : "As entradas foram suficientes para cobrir as saidas deste periodo.",
    tone: kpis.totalExpenseCents > kpis.totalIncomeCents ? "warning" : "positive",
  });

  insights.push({
    id: "period-result",
    title: kpis.periodResultCents >= 0 ? "Resultado positivo no periodo" : "Resultado negativo no periodo",
    description:
      kpis.periodResultCents >= 0
        ? "O resultado do periodo ficou acima de zero."
        : "O resultado do periodo ficou abaixo de zero, sem julgamento: e um ponto de atencao para recalcular a rota.",
    tone: kpis.periodResultCents >= 0 ? "positive" : "warning",
    amountCents: Math.abs(kpis.periodResultCents),
  });

  if (kpis.averageExpenseCents !== null) {
    insights.push({
      id: "average-expense",
      title: "Gasto medio por saida",
      description: "Media das despesas dividida pela quantidade de transacoes de saida.",
      tone: "neutral",
      amountCents: kpis.averageExpenseCents,
    });
  }

  insights.push({
    id: "transaction-count",
    title: "Volume de transacoes",
    description: `${kpis.includedTransactionCount} transacoes financeiras foram consideradas neste periodo.`,
    tone: "neutral",
  });

  return insights;
}
