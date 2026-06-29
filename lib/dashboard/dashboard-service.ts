import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  resolveFixedDashboardDateRange,
  resolveImportedPeriodDateRange,
} from "@/lib/dashboard/date-filters";
import type {
  DashboardChartGranularity,
  DashboardCharts,
  DashboardDateFilterId,
  DashboardDateRange,
  DashboardInsight,
  DashboardQueryParams,
  DashboardSummary,
  DashboardTransactionItem,
  FinancialKpis,
} from "@/lib/dashboard/dashboard-types";

const DEFAULT_DASHBOARD_FILTER: DashboardDateFilterId = "imported-period";
const RECENT_TRANSACTIONS_LIMIT = 10;

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
  const dashboardLargestExpense = largestExpense
    ? {
        id: largestExpense.id,
        occurredAt: largestExpense.occurredAt.toISOString(),
        description: largestExpense.description,
        amountCents: Math.abs(largestExpense.amountCents),
      }
    : null;

  return {
    period,
    kpis,
    largestExpense: dashboardLargestExpense,
    recentTransactions: buildRecentTransactions(transactions),
    charts: buildDashboardCharts(period, transactions),
    insights: buildDashboardInsights(kpis, dashboardLargestExpense),
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
    recentTransactions: [],
    charts: {
      granularity: "day",
      cashflow: [],
      incomeExpense: {
        incomeCents: 0,
        expenseCents: 0,
      },
    },
    insights: [],
  };
}

function buildRecentTransactions(transactions: DashboardTransaction[]): DashboardTransactionItem[] {
  return transactions.slice(0, RECENT_TRANSACTIONS_LIMIT).map((transaction) => ({
    id: transaction.id,
    occurredAt: transaction.occurredAt.toISOString(),
    description: transaction.description,
    direction: transaction.direction,
    amountCents: transaction.amountCents,
  }));
}

function isIncomeTransaction(transaction: DashboardTransaction) {
  return transaction.direction === "INCOME" || transaction.amountCents > 0;
}

function isExpenseTransaction(transaction: DashboardTransaction) {
  return transaction.direction === "EXPENSE" || transaction.amountCents < 0;
}

function buildDashboardCharts(period: DashboardDateRange, transactions: DashboardTransaction[]): DashboardCharts {
  const granularity: DashboardChartGranularity = period.dayCount > 92 ? "month" : "day";
  const buckets = createPeriodBuckets(period, granularity);

  for (const transaction of transactions) {
    const key = getBucketKey(transaction.occurredAt, granularity);
    const bucket = buckets.get(key);

    if (!bucket) {
      continue;
    }

    if (isIncomeTransaction(transaction)) {
      bucket.incomeCents += Math.abs(transaction.amountCents);
    }

    if (isExpenseTransaction(transaction)) {
      bucket.expenseCents += Math.abs(transaction.amountCents);
    }

    bucket.transactionCount += 1;
  }

  let cumulativeBalanceCents = 0;
  const cashflow = Array.from(buckets.values()).map((bucket) => {
    const balanceCents = bucket.incomeCents - bucket.expenseCents;
    cumulativeBalanceCents += balanceCents;

    return {
      ...bucket,
      balanceCents,
      cumulativeBalanceCents,
    };
  });

  return {
    granularity,
    cashflow,
    incomeExpense: {
      incomeCents: cashflow.reduce((total, point) => total + point.incomeCents, 0),
      expenseCents: cashflow.reduce((total, point) => total + point.expenseCents, 0),
    },
  };
}

function createPeriodBuckets(period: DashboardDateRange, granularity: DashboardChartGranularity) {
  const buckets = new Map<
    string,
    {
      key: string;
      label: string;
      incomeCents: number;
      expenseCents: number;
      transactionCount: number;
    }
  >();

  if (!period.startDate || !period.endDate) {
    return buckets;
  }

  const cursor = new Date(
    Date.UTC(period.startDate.getUTCFullYear(), period.startDate.getUTCMonth(), period.startDate.getUTCDate()),
  );
  const end = new Date(
    Date.UTC(period.endDate.getUTCFullYear(), period.endDate.getUTCMonth(), period.endDate.getUTCDate()),
  );

  while (cursor.getTime() <= end.getTime()) {
    const key = getBucketKey(cursor, granularity);

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        label: formatBucketLabel(cursor, granularity),
        incomeCents: 0,
        expenseCents: 0,
        transactionCount: 0,
      });
    }

    if (granularity === "month") {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
    } else {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  return buckets;
}

function getBucketKey(date: Date, granularity: DashboardChartGranularity) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  if (granularity === "month") {
    return `${year}-${month}`;
  }

  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatBucketLabel(date: Date, granularity: DashboardChartGranularity) {
  if (granularity === "month") {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
      .format(date)
      .replace(".", "");
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function buildDashboardInsights(
  kpis: FinancialKpis,
  largestExpense: NonNullable<DashboardSummary["largestExpense"]> | null,
): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  if (largestExpense) {
    insights.push({
      id: "largest-expense",
      title: "Maior gasto do periodo",
      description: "A maior saida registrada ajuda a entender onde o fluxo mais pesou.",
      tone: "neutral",
      amountCents: largestExpense.amountCents,
    });
  }

  insights.push({
    id: "income-expense-balance",
    title: kpis.totalExpenseCents > kpis.totalIncomeCents ? "Saidas acima das entradas" : "Entradas cobriram as saidas",
    description:
      kpis.totalExpenseCents > kpis.totalIncomeCents
        ? "O periodo fechou com mais saidas do que entradas. Vale acompanhar a rota nos proximos lancamentos."
        : "As entradas foram suficientes para cobrir as saidas deste periodo.",
    tone: kpis.totalExpenseCents > kpis.totalIncomeCents ? "warning" : "positive",
  });

  insights.push({
    id: "period-balance",
    title: kpis.balanceCents >= 0 ? "Saldo positivo no periodo" : "Saldo negativo no periodo",
    description:
      kpis.balanceCents >= 0
        ? "O saldo do periodo ficou acima de zero."
        : "O saldo do periodo ficou abaixo de zero, sem julgamento: e um ponto de atencao para recalcular a rota.",
    tone: kpis.balanceCents >= 0 ? "positive" : "warning",
    amountCents: Math.abs(kpis.balanceCents),
  });

  insights.push({
    id: "average-daily-expense",
    title: "Gasto medio diario",
    description: "Media simples das saidas dividida pelos dias do periodo selecionado.",
    tone: "neutral",
    amountCents: kpis.averageDailyExpenseCents,
  });

  insights.push({
    id: "transaction-count",
    title: "Volume de transacoes",
    description: `${kpis.transactionCount} transacoes foram consideradas neste periodo.`,
    tone: "neutral",
  });

  return insights;
}
