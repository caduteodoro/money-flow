import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  resolveFixedDashboardDateRange,
  resolveImportedPeriodDateRange,
} from "@/lib/dashboard/date-filters";
import type {
  DashboardDateFilterId,
  DashboardDateRange,
  DashboardQueryParams,
  DashboardSummary,
  FinancialKpis,
} from "@/lib/dashboard/dashboard-types";

const DEFAULT_DASHBOARD_FILTER: DashboardDateFilterId = "imported-period";

type DashboardTransaction = {
  id: string;
  occurredAt: Date;
  description: string;
  amountCents: number;
  direction: string;
};

export async function getDashboardSummary(params: DashboardQueryParams): Promise<DashboardSummary> {
  if (!params.userId) {
    throw new Error("Usuario autenticado obrigatorio para consultar o dashboard.");
  }

  const dateFilter = params.dateFilter ?? DEFAULT_DASHBOARD_FILTER;
  const period = await resolveDashboardDateRange(params.userId, dateFilter, params.now);

  if (!period.startDate || !period.endDate) {
    return buildEmptyDashboardSummary(period);
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: params.userId,
      occurredAt: {
        gte: period.startDate,
        lte: period.endDate,
      },
    },
    select: {
      id: true,
      occurredAt: true,
      description: true,
      amountCents: true,
      direction: true,
    },
    orderBy: {
      occurredAt: "desc",
    },
  });

  return buildDashboardSummary(period, transactions);
}

async function resolveDashboardDateRange(
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

function buildDashboardSummary(period: DashboardDateRange, transactions: DashboardTransaction[]): DashboardSummary {
  const kpis = calculateFinancialKpis(transactions, period.dayCount);
  const largestExpense = transactions
    .filter(isExpenseTransaction)
    .sort((first, second) => Math.abs(second.amountCents) - Math.abs(first.amountCents))[0];

  return {
    period,
    kpis,
    largestExpense: largestExpense
      ? {
          id: largestExpense.id,
          occurredAt: largestExpense.occurredAt.toISOString(),
          description: largestExpense.description,
          amountCents: Math.abs(largestExpense.amountCents),
        }
      : null,
  };
}

function calculateFinancialKpis(transactions: DashboardTransaction[], dayCount: number): FinancialKpis {
  const totals = transactions.reduce(
    (accumulator, transaction) => {
      if (isIncomeTransaction(transaction)) {
        accumulator.totalIncomeCents += Math.abs(transaction.amountCents);
      }

      if (isExpenseTransaction(transaction)) {
        accumulator.totalExpenseCents += Math.abs(transaction.amountCents);
      }

      return accumulator;
    },
    {
      totalIncomeCents: 0,
      totalExpenseCents: 0,
    },
  );

  return {
    totalIncomeCents: totals.totalIncomeCents,
    totalExpenseCents: totals.totalExpenseCents,
    balanceCents: totals.totalIncomeCents - totals.totalExpenseCents,
    averageDailyExpenseCents: dayCount > 0 ? Math.round(totals.totalExpenseCents / dayCount) : 0,
    transactionCount: transactions.length,
  };
}

function buildEmptyDashboardSummary(period: DashboardDateRange): DashboardSummary {
  return {
    period,
    kpis: {
      totalIncomeCents: 0,
      totalExpenseCents: 0,
      balanceCents: 0,
      averageDailyExpenseCents: 0,
      transactionCount: 0,
    },
    largestExpense: null,
  };
}

function isIncomeTransaction(transaction: DashboardTransaction) {
  return transaction.direction === "INCOME" || transaction.amountCents > 0;
}

function isExpenseTransaction(transaction: DashboardTransaction) {
  return transaction.direction === "EXPENSE" || transaction.amountCents < 0;
}
