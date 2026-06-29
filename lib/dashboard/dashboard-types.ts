export type DashboardDateFilterId = "imported-period" | "last-30-days" | "current-month" | "previous-month";

export type DashboardDateRange = {
  filter: DashboardDateFilterId;
  startDate: Date | null;
  endDate: Date | null;
  dayCount: number;
};

export type DashboardQueryParams = {
  userId: string;
  dateFilter?: DashboardDateFilterId;
  now?: Date;
};

export type FinancialKpis = {
  totalIncomeCents: number;
  totalExpenseCents: number;
  balanceCents: number;
  averageDailyExpenseCents: number;
  transactionCount: number;
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
  direction: string;
  amountCents: number;
};

export type DashboardChartGranularity = "day" | "month";

export type DashboardTimeSeriesPoint = {
  key: string;
  label: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  cumulativeBalanceCents: number;
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

export type DashboardInsightTone = "positive" | "warning" | "neutral";

export type DashboardInsight = {
  id: string;
  title: string;
  description: string;
  tone: DashboardInsightTone;
  amountCents?: number;
};

export type DashboardSummary = {
  period: DashboardDateRange;
  kpis: FinancialKpis;
  largestExpense: DashboardLargestExpense;
  recentTransactions: DashboardTransactionItem[];
  charts: DashboardCharts;
  insights: DashboardInsight[];
};
