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

export type DashboardSummary = {
  period: DashboardDateRange;
  kpis: FinancialKpis;
  largestExpense: DashboardLargestExpense;
};
