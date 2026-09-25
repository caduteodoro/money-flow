import type { CategorizationSource, TransactionDirection } from "@prisma/client";

export type DashboardDateFilterId = "imported-period" | "last-30-days" | "current-month" | "previous-month";

export type DashboardDateRange = {
  filter: DashboardDateFilterId;
  startInclusive: Date | null;
  endExclusive: Date | null;
  dayCount: number;
};

export type DashboardQueryParams = {
  userId: string;
  dateFilter?: DashboardDateFilterId;
  now?: Date;
};

export type DashboardFinancialTransaction = {
  id: string;
  occurredAt: Date;
  amountCents: number;
  direction: TransactionDirection;
};

export type DashboardTransactionCategory = {
  id: string;
  name: string;
  parent: {
    id: string;
    name: string;
  } | null;
};

export type DashboardAnalyticsTransaction = DashboardFinancialTransaction & {
  description: string;
  normalizedDescription: string | null;
  descriptionHash: string | null;
  categoryId: string | null;
  categorizationSource: CategorizationSource;
  category: DashboardTransactionCategory | null;
};

export type FinancialKpis = {
  totalIncomeCents: number;
  totalExpenseCents: number;
  periodResultCents: number;
  averageExpenseCents: number | null;
  largestExpenseCents: number | null;
  includedTransactionCount: number;
};

export type DashboardComparisonStatus = "INCREASE" | "DECREASE" | "UNCHANGED" | "NO_BASIS";

export type DashboardMetricComparison = {
  currentValue: number | null;
  previousValue: number | null;
  absoluteChange: number | null;
  percentageChange: number | null;
  comparisonStatus: DashboardComparisonStatus;
};

export type DashboardKpiComparisons = {
  totalIncomeCents: DashboardMetricComparison;
  totalExpenseCents: DashboardMetricComparison;
  periodResultCents: DashboardMetricComparison;
  averageExpenseCents: DashboardMetricComparison;
  largestExpenseCents: DashboardMetricComparison;
  includedTransactionCount: DashboardMetricComparison;
};

export type DashboardLargestExpense = {
  id: string;
  occurredAt: string;
  description: string;
  amountCents: number;
} | null;

export type DashboardTransactionItem = {
  id: string;
  occurredAt: string;
  description: string;
  direction: TransactionDirection;
  amountCents: number;
  category: {
    id: string;
    name: string;
    rootCategoryId: string;
    rootCategoryName: string;
  } | null;
};

export type DashboardChartGranularity = "day" | "month";

export type DashboardTimeSeriesPoint = {
  key: string;
  label: string;
  startInclusive: string;
  endExclusive: string;
  incomeCents: number;
  expenseCents: number;
  periodResultCents: number;
  cumulativeResultCents: number;
  transactionCount: number;
};

export type DashboardIncomeExpenseComparison = {
  incomeCents: number;
  expenseCents: number;
};

export type DashboardCharts = {
  granularity: DashboardChartGranularity;
  cashflow: DashboardTimeSeriesPoint[];
  incomeExpense: DashboardIncomeExpenseComparison;
};

export type DashboardDrillThroughTarget =
  | { kind: "ROOT_CATEGORY"; rootCategoryId: string }
  | { kind: "UNCATEGORIZED" }
  | {
      kind: "NORMALIZED_DESCRIPTION";
      descriptionHash: string | null;
      normalizedDescription: string | null;
    }
  | { kind: "UNIDENTIFIED_DESCRIPTION" }
  | { kind: "TRANSACTION"; transactionId: string }
  | { kind: "DAY"; date: string }
  | { kind: "ROOT_CATEGORY_SET"; rootCategoryIds: string[] };

export type DashboardRootCategoryGroup = {
  kind: "ROOT_CATEGORY";
  rootCategoryId: string;
  rootCategoryName: string;
  amountCents: number;
  transactionCount: number;
  target: Extract<DashboardDrillThroughTarget, { kind: "ROOT_CATEGORY" }>;
};

export type DashboardUncategorizedGroup = {
  kind: "UNCATEGORIZED";
  label: "Sem categoria";
  amountCents: number;
  transactionCount: number;
  target: Extract<DashboardDrillThroughTarget, { kind: "UNCATEGORIZED" }>;
};

export type DashboardOtherCategoryGroup = {
  kind: "OTHER";
  label: "Outros";
  amountCents: number;
  transactionCount: number;
  target: Extract<DashboardDrillThroughTarget, { kind: "ROOT_CATEGORY_SET" }>;
};

export type DashboardCategoryCoverage = {
  totalExpenseCents: number;
  totalExpenseCount: number;
  categorizedExpenseCents: number;
  categorizedExpenseCount: number;
  uncategorizedExpenseCents: number;
  uncategorizedExpenseCount: number;
  amountCoveragePercentage: number | null;
  countCoveragePercentage: number | null;
};

export type DashboardCategoryAnalytics = {
  rootCategories: DashboardRootCategoryGroup[];
  uncategorized: DashboardUncategorizedGroup;
  coverage: DashboardCategoryCoverage;
  topCategory: DashboardRootCategoryGroup | null;
};

export type DashboardGroupedCategories = {
  visibleCategories: DashboardRootCategoryGroup[];
  other: DashboardOtherCategoryGroup | null;
  uncategorized: DashboardUncategorizedGroup;
};

export type DashboardEvolutionChartModel = {
  labels: string[];
  incomeCents: number[];
  expenseCents: number[];
  cumulativeResultCents: number[];
};

export type DashboardCategoryDestinationItem = {
  key: string;
  kind: "ROOT_CATEGORY" | "OTHER" | "UNCATEGORIZED";
  label: string;
  amountCents: number;
  transactionCount: number;
  percentage: number;
  target: DashboardDrillThroughTarget;
};

export type DashboardCategoryDestinationModel = {
  totalExpenseCents: number;
  items: DashboardCategoryDestinationItem[];
};

export type DashboardExpenseOffender = {
  id: string;
  occurredAt: string;
  description: string;
  amountCents: number;
  target: Extract<DashboardDrillThroughTarget, { kind: "TRANSACTION" }>;
};

export type DashboardDescriptionOffender = {
  key: string;
  label: string;
  amountCents: number;
  transactionCount: number;
  target: Extract<
    DashboardDrillThroughTarget,
    { kind: "NORMALIZED_DESCRIPTION" | "UNIDENTIFIED_DESCRIPTION" }
  >;
};

export type DashboardExpenseDayOffender = {
  date: string;
  amountCents: number;
  transactionCount: number;
  target: Extract<DashboardDrillThroughTarget, { kind: "DAY" }>;
};

export type DashboardOffenders = {
  largestExpenses: DashboardExpenseOffender[];
  topNormalizedDescriptions: DashboardDescriptionOffender[];
  topCategory: DashboardRootCategoryGroup | null;
  topExpenseDays: DashboardExpenseDayOffender[];
};

export type DashboardOffenderLimits = {
  largestExpenses: number;
  normalizedDescriptions: number;
  expenseDays: number;
};

export type DashboardInsightTone = "positive" | "warning" | "neutral";

export type DashboardInsight = {
  id: string;
  title: string;
  description: string;
  tone: DashboardInsightTone;
  amountCents?: number;
  target?: DashboardDrillThroughTarget;
};

export type DashboardSummary = {
  period: DashboardDateRange;
  comparisonPeriod: DashboardDateRange | null;
  hasImportedTransactions: boolean;
  periodTransactionCount: number;
  kpis: FinancialKpis;
  comparisons: DashboardKpiComparisons;
  largestExpense: DashboardLargestExpense;
  recentTransactions: DashboardTransactionItem[];
  charts: DashboardCharts;
  categories: DashboardCategoryAnalytics;
  offenders: DashboardOffenders;
  insights: DashboardInsight[];
};
