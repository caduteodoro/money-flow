import type { DashboardDateFilterId, DashboardDateRange } from "@/lib/dashboard/dashboard-types";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export function resolveFixedDashboardDateRange(
  filter: Exclude<DashboardDateFilterId, "imported-period">,
  now = new Date(),
): DashboardDateRange {
  if (filter === "last-30-days") {
    const endDate = endOfUtcDay(now);
    const startDate = startOfUtcDay(addUtcDays(endDate, -29));

    return buildRange(filter, startDate, endDate);
  }

  if (filter === "current-month") {
    const startDate = startOfUtcMonth(now);
    const endDate = endOfUtcMonth(now);

    return buildRange(filter, startDate, endDate);
  }

  const previousMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const startDate = startOfUtcMonth(previousMonthDate);
  const endDate = endOfUtcMonth(previousMonthDate);

  return buildRange(filter, startDate, endDate);
}

export function resolveImportedPeriodDateRange(startDate: Date | null, endDate: Date | null): DashboardDateRange {
  if (!startDate || !endDate) {
    return {
      filter: "imported-period",
      startDate: null,
      endDate: null,
      dayCount: 0,
    };
  }

  return buildRange("imported-period", startOfUtcDay(startDate), endOfUtcDay(endDate));
}

export function countInclusiveUtcDays(startDate: Date, endDate: Date) {
  const start = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  const end = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());

  return Math.max(1, Math.floor((end - start) / ONE_DAY_IN_MS) + 1);
}

function buildRange(filter: DashboardDateFilterId, startDate: Date, endDate: Date): DashboardDateRange {
  return {
    filter,
    startDate,
    endDate,
    dayCount: countInclusiveUtcDays(startDate, endDate),
  };
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function addUtcDays(date: Date, days: number) {
  return new Date(date.getTime() + days * ONE_DAY_IN_MS);
}
