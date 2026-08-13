import type {
  DashboardAnalyticsTransaction,
  DashboardCategoryAnalytics,
  DashboardChartGranularity,
  DashboardDateRange,
  DashboardDescriptionOffender,
  DashboardExpenseDayOffender,
  DashboardExpenseOffender,
  DashboardFinancialTransaction,
  DashboardGroupedCategories,
  DashboardKpiComparisons,
  DashboardMetricComparison,
  DashboardOffenderLimits,
  DashboardOffenders,
  DashboardRootCategoryGroup,
  DashboardTimeSeriesPoint,
  FinancialKpis,
} from "@/lib/dashboard/dashboard-types";

export const MONTHLY_GRANULARITY_THRESHOLD_DAYS = 92;
export const UNIDENTIFIED_DESCRIPTION_LABEL = "Descrição não identificada";

export function isIncludedFinancialDirection(
  direction: DashboardFinancialTransaction["direction"],
): direction is "INCOME" | "EXPENSE" {
  // REVERSAL stays excluded until the data model can relate it safely to an original transaction.
  return direction === "INCOME" || direction === "EXPENSE";
}

export function calculateFinancialKpis(transactions: readonly DashboardFinancialTransaction[]): FinancialKpis {
  let totalIncomeCents = 0;
  let totalExpenseCents = 0;
  let expenseCount = 0;
  let includedTransactionCount = 0;
  let largestExpenseCents: number | null = null;

  for (const transaction of transactions) {
    const amountCents = Math.abs(transaction.amountCents);

    if (transaction.direction === "INCOME") {
      totalIncomeCents += amountCents;
      includedTransactionCount += 1;
    } else if (transaction.direction === "EXPENSE") {
      totalExpenseCents += amountCents;
      expenseCount += 1;
      includedTransactionCount += 1;
      largestExpenseCents = Math.max(largestExpenseCents ?? 0, amountCents);
    }
  }

  return {
    totalIncomeCents,
    totalExpenseCents,
    periodResultCents: totalIncomeCents - totalExpenseCents,
    averageExpenseCents: expenseCount > 0 ? Math.round(totalExpenseCents / expenseCount) : null,
    largestExpenseCents,
    includedTransactionCount,
  };
}

export function compareDashboardMetric(
  currentValue: number | null,
  previousValue: number | null,
): DashboardMetricComparison {
  const absoluteChange = currentValue !== null && previousValue !== null ? currentValue - previousValue : null;

  if (currentValue === null || previousValue === null || previousValue === 0) {
    return {
      currentValue,
      previousValue,
      absoluteChange,
      percentageChange: null,
      comparisonStatus: "NO_BASIS",
    };
  }

  const comparableAbsoluteChange = currentValue - previousValue;
  const percentageChange = (comparableAbsoluteChange / Math.abs(previousValue)) * 100;

  return {
    currentValue,
    previousValue,
    absoluteChange: comparableAbsoluteChange,
    percentageChange,
    comparisonStatus:
      comparableAbsoluteChange > 0
        ? "INCREASE"
        : comparableAbsoluteChange < 0
          ? "DECREASE"
          : "UNCHANGED",
  };
}

export function buildDashboardKpiComparisons(
  current: FinancialKpis,
  previous: FinancialKpis | null,
): DashboardKpiComparisons {
  return {
    totalIncomeCents: compareDashboardMetric(current.totalIncomeCents, previous?.totalIncomeCents ?? null),
    totalExpenseCents: compareDashboardMetric(current.totalExpenseCents, previous?.totalExpenseCents ?? null),
    periodResultCents: compareDashboardMetric(current.periodResultCents, previous?.periodResultCents ?? null),
    averageExpenseCents: compareDashboardMetric(current.averageExpenseCents, previous?.averageExpenseCents ?? null),
    largestExpenseCents: compareDashboardMetric(current.largestExpenseCents, previous?.largestExpenseCents ?? null),
    includedTransactionCount: compareDashboardMetric(
      current.includedTransactionCount,
      previous?.includedTransactionCount ?? null,
    ),
  };
}

export function resolveDashboardChartGranularity(dayCount: number): DashboardChartGranularity {
  return dayCount > MONTHLY_GRANULARITY_THRESHOLD_DAYS ? "month" : "day";
}

export function buildDashboardTimeSeries(
  period: DashboardDateRange,
  transactions: readonly DashboardFinancialTransaction[],
): { granularity: DashboardChartGranularity; points: DashboardTimeSeriesPoint[] } {
  const granularity = resolveDashboardChartGranularity(period.dayCount);
  const buckets = createPeriodBuckets(period, granularity);

  if (!period.startInclusive || !period.endExclusive) {
    return { granularity, points: [] };
  }

  for (const transaction of transactions) {
    if (
      !isIncludedFinancialDirection(transaction.direction) ||
      transaction.occurredAt < period.startInclusive ||
      transaction.occurredAt >= period.endExclusive
    ) {
      continue;
    }

    const bucket = buckets.get(getBucketKey(transaction.occurredAt, granularity));

    if (!bucket) {
      continue;
    }

    if (transaction.direction === "INCOME") {
      bucket.incomeCents += Math.abs(transaction.amountCents);
    } else {
      bucket.expenseCents += Math.abs(transaction.amountCents);
    }

    bucket.transactionCount += 1;
  }

  let cumulativeResultCents = 0;
  const points = Array.from(buckets.values()).map((bucket) => {
    const periodResultCents = bucket.incomeCents - bucket.expenseCents;
    cumulativeResultCents += periodResultCents;

    return {
      ...bucket,
      periodResultCents,
      cumulativeResultCents,
    };
  });

  return { granularity, points };
}

export function calculateCategoryAnalytics(
  transactions: readonly DashboardAnalyticsTransaction[],
): DashboardCategoryAnalytics {
  const rootCategoryMap = new Map<string, DashboardRootCategoryGroup>();
  let totalExpenseCents = 0;
  let totalExpenseCount = 0;
  let uncategorizedExpenseCents = 0;
  let uncategorizedExpenseCount = 0;

  for (const transaction of transactions) {
    if (transaction.direction !== "EXPENSE") {
      continue;
    }

    const amountCents = Math.abs(transaction.amountCents);
    totalExpenseCents += amountCents;
    totalExpenseCount += 1;

    const rootCategory = resolveRootCategory(transaction.category);

    if (!rootCategory) {
      uncategorizedExpenseCents += amountCents;
      uncategorizedExpenseCount += 1;
      continue;
    }

    const existing = rootCategoryMap.get(rootCategory.id);

    if (existing) {
      existing.amountCents += amountCents;
      existing.transactionCount += 1;
      continue;
    }

    rootCategoryMap.set(rootCategory.id, {
      kind: "ROOT_CATEGORY",
      rootCategoryId: rootCategory.id,
      rootCategoryName: rootCategory.name,
      amountCents,
      transactionCount: 1,
      target: { kind: "ROOT_CATEGORY", rootCategoryId: rootCategory.id },
    });
  }

  const rootCategories = Array.from(rootCategoryMap.values()).sort(compareRootCategoryGroups);
  const categorizedExpenseCents = totalExpenseCents - uncategorizedExpenseCents;
  const categorizedExpenseCount = totalExpenseCount - uncategorizedExpenseCount;

  return {
    rootCategories,
    uncategorized: {
      kind: "UNCATEGORIZED",
      label: "Sem categoria",
      amountCents: uncategorizedExpenseCents,
      transactionCount: uncategorizedExpenseCount,
      target: { kind: "UNCATEGORIZED" },
    },
    coverage: {
      totalExpenseCents,
      totalExpenseCount,
      categorizedExpenseCents,
      categorizedExpenseCount,
      uncategorizedExpenseCents,
      uncategorizedExpenseCount,
      amountCoveragePercentage:
        totalExpenseCents > 0 ? (categorizedExpenseCents / totalExpenseCents) * 100 : null,
      countCoveragePercentage:
        totalExpenseCount > 0 ? (categorizedExpenseCount / totalExpenseCount) * 100 : null,
    },
    topCategory: rootCategories[0] ?? null,
  };
}

export function groupDashboardCategories(
  analytics: DashboardCategoryAnalytics,
  visibleCategoryLimit: number,
): DashboardGroupedCategories {
  assertNonNegativeInteger(visibleCategoryLimit, "O limite de categorias visiveis deve ser um inteiro nao negativo.");

  const orderedCategories = [...analytics.rootCategories].sort(compareRootCategoryGroups);
  const visibleCategories = orderedCategories.slice(0, visibleCategoryLimit);
  const hiddenCategories = orderedCategories.slice(visibleCategoryLimit);

  return {
    visibleCategories,
    other:
      hiddenCategories.length > 0
        ? {
            kind: "OTHER",
            label: "Outros",
            amountCents: hiddenCategories.reduce((total, category) => total + category.amountCents, 0),
            transactionCount: hiddenCategories.reduce(
              (total, category) => total + category.transactionCount,
              0,
            ),
            target: {
              kind: "ROOT_CATEGORY_SET",
              rootCategoryIds: hiddenCategories.map((category) => category.rootCategoryId),
            },
          }
        : null,
    uncategorized: analytics.uncategorized,
  };
}

export function buildDashboardOffenders(
  transactions: readonly DashboardAnalyticsTransaction[],
  categoryAnalytics: DashboardCategoryAnalytics,
  limits: DashboardOffenderLimits,
): DashboardOffenders {
  assertNonNegativeInteger(limits.largestExpenses, "O limite de maiores despesas deve ser nao negativo.");
  assertNonNegativeInteger(
    limits.normalizedDescriptions,
    "O limite de descricoes normalizadas deve ser nao negativo.",
  );
  assertNonNegativeInteger(limits.expenseDays, "O limite de dias de despesa deve ser nao negativo.");

  const expenses = transactions.filter((transaction) => transaction.direction === "EXPENSE");

  return {
    largestExpenses: buildLargestExpenseOffenders(expenses).slice(0, limits.largestExpenses),
    topNormalizedDescriptions: buildDescriptionOffenders(expenses).slice(0, limits.normalizedDescriptions),
    topCategory: categoryAnalytics.topCategory,
    topExpenseDays: buildExpenseDayOffenders(expenses).slice(0, limits.expenseDays),
  };
}

function createPeriodBuckets(period: DashboardDateRange, granularity: DashboardChartGranularity) {
  const buckets = new Map<
    string,
    Omit<DashboardTimeSeriesPoint, "periodResultCents" | "cumulativeResultCents">
  >();

  if (!period.startInclusive || !period.endExclusive) {
    return buckets;
  }

  let cursor = new Date(period.startInclusive);

  while (cursor < period.endExclusive) {
    const bucketEnd =
      granularity === "month"
        ? minimumDate(
            new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1)),
            period.endExclusive,
          )
        : minimumDate(new Date(cursor.getTime() + 24 * 60 * 60 * 1000), period.endExclusive);
    const key = getBucketKey(cursor, granularity);

    buckets.set(key, {
      key,
      label: formatBucketLabel(cursor, granularity),
      startInclusive: cursor.toISOString(),
      endExclusive: bucketEnd.toISOString(),
      incomeCents: 0,
      expenseCents: 0,
      transactionCount: 0,
    });

    cursor = bucketEnd;
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

function minimumDate(first: Date, second: Date) {
  return first < second ? first : new Date(second);
}

function resolveRootCategory(category: DashboardAnalyticsTransaction["category"]) {
  if (!category) {
    return null;
  }

  return category.parent ?? { id: category.id, name: category.name };
}

function compareRootCategoryGroups(first: DashboardRootCategoryGroup, second: DashboardRootCategoryGroup) {
  return (
    second.amountCents - first.amountCents ||
    second.transactionCount - first.transactionCount ||
    compareText(normalizeText(first.rootCategoryName), normalizeText(second.rootCategoryName)) ||
    compareText(first.rootCategoryId, second.rootCategoryId)
  );
}

function buildLargestExpenseOffenders(
  expenses: readonly DashboardAnalyticsTransaction[],
): DashboardExpenseOffender[] {
  return [...expenses]
    .sort(
      (first, second) =>
        Math.abs(second.amountCents) - Math.abs(first.amountCents) ||
        second.occurredAt.getTime() - first.occurredAt.getTime() ||
        compareText(first.id, second.id),
    )
    .map((transaction) => ({
      id: transaction.id,
      occurredAt: transaction.occurredAt.toISOString(),
      description: transaction.description,
      amountCents: Math.abs(transaction.amountCents),
      target: { kind: "TRANSACTION", transactionId: transaction.id },
    }));
}

function buildDescriptionOffenders(
  expenses: readonly DashboardAnalyticsTransaction[],
): DashboardDescriptionOffender[] {
  const groups = new Map<string, DashboardDescriptionOffender>();

  for (const transaction of expenses) {
    const normalizedDescription = normalizeOptionalDescription(transaction.normalizedDescription);
    const descriptionHash = normalizeOptionalDescription(transaction.descriptionHash);
    const key = descriptionHash
      ? `hash:${descriptionHash}`
      : normalizedDescription
        ? `description:${normalizeText(normalizedDescription)}`
        : "unidentified";
    const existing = groups.get(key);

    if (existing) {
      existing.amountCents += Math.abs(transaction.amountCents);
      existing.transactionCount += 1;

      if (
        normalizedDescription &&
        (existing.label === UNIDENTIFIED_DESCRIPTION_LABEL ||
          compareText(normalizeText(normalizedDescription), normalizeText(existing.label)) < 0 ||
          (normalizeText(normalizedDescription) === normalizeText(existing.label) &&
            compareText(normalizedDescription, existing.label) < 0))
      ) {
        existing.label = normalizedDescription;
        existing.target = {
          kind: "NORMALIZED_DESCRIPTION",
          descriptionHash,
          normalizedDescription,
        };
      }

      continue;
    }

    groups.set(key, {
      key,
      label: normalizedDescription ?? UNIDENTIFIED_DESCRIPTION_LABEL,
      amountCents: Math.abs(transaction.amountCents),
      transactionCount: 1,
      target:
        descriptionHash || normalizedDescription
          ? {
              kind: "NORMALIZED_DESCRIPTION",
              descriptionHash,
              normalizedDescription,
            }
          : { kind: "UNIDENTIFIED_DESCRIPTION" },
    });
  }

  return Array.from(groups.values()).sort(
    (first, second) =>
      second.amountCents - first.amountCents ||
      second.transactionCount - first.transactionCount ||
      compareText(normalizeText(first.label), normalizeText(second.label)) ||
      compareText(first.key, second.key),
  );
}

function buildExpenseDayOffenders(
  expenses: readonly DashboardAnalyticsTransaction[],
): DashboardExpenseDayOffender[] {
  const groups = new Map<string, DashboardExpenseDayOffender>();

  for (const transaction of expenses) {
    const date = transaction.occurredAt.toISOString().slice(0, 10);
    const existing = groups.get(date);

    if (existing) {
      existing.amountCents += Math.abs(transaction.amountCents);
      existing.transactionCount += 1;
      continue;
    }

    groups.set(date, {
      date,
      amountCents: Math.abs(transaction.amountCents),
      transactionCount: 1,
      target: { kind: "DAY", date },
    });
  }

  return Array.from(groups.values()).sort(
    (first, second) =>
      second.amountCents - first.amountCents ||
      second.transactionCount - first.transactionCount ||
      compareText(first.date, second.date),
  );
}

function normalizeOptionalDescription(value: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeText(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function compareText(first: string, second: string) {
  return first < second ? -1 : first > second ? 1 : 0;
}

function assertNonNegativeInteger(value: number, message: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(message);
  }
}
