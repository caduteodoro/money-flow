import type { DashboardDateFilterId, DashboardDateRange } from "@/lib/dashboard/dashboard-types";

export const UTC_DAY_IN_MS = 24 * 60 * 60 * 1000;

const dashboardDateFilters = new Set<DashboardDateFilterId>([
  "imported-period",
  "last-30-days",
  "current-month",
  "previous-month",
]);

export type DashboardDateFilterParseResult =
  | { ok: true; filter: DashboardDateFilterId }
  | { ok: false; reason: "INVALID_PRESET" };

export function parseDashboardDateFilter(value: string | undefined): DashboardDateFilterParseResult {
  if (value === undefined) {
    return { ok: true, filter: "imported-period" };
  }

  if (dashboardDateFilters.has(value as DashboardDateFilterId)) {
    return { ok: true, filter: value as DashboardDateFilterId };
  }

  return { ok: false, reason: "INVALID_PRESET" };
}

export function resolveFixedDashboardDateRange(
  filter: Exclude<DashboardDateFilterId, "imported-period">,
  now = new Date(),
): DashboardDateRange {
  assertValidDate(now, "Relogio invalido para resolver o periodo do dashboard.");

  if (filter === "last-30-days") {
    const endExclusive = addUtcDays(startOfUtcDay(now), 1);
    const startInclusive = addUtcDays(endExclusive, -30);

    return buildRange(filter, startInclusive, endExclusive);
  }

  if (filter === "current-month") {
    const startInclusive = startOfUtcMonth(now);
    const endExclusive = addUtcDays(startOfUtcDay(now), 1);

    return buildRange(filter, startInclusive, endExclusive);
  }

  const startInclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const endExclusive = startOfUtcMonth(now);

  return buildRange(filter, startInclusive, endExclusive);
}

export function resolveImportedPeriodDateRange(
  minimumOccurredAt: Date | null,
  maximumOccurredAt: Date | null,
): DashboardDateRange {
  if (!minimumOccurredAt || !maximumOccurredAt) {
    return {
      filter: "imported-period",
      startInclusive: null,
      endExclusive: null,
      dayCount: 0,
    };
  }

  assertValidDate(minimumOccurredAt, "Data minima importada invalida.");
  assertValidDate(maximumOccurredAt, "Data maxima importada invalida.");

  return buildRange(
    "imported-period",
    startOfUtcDay(minimumOccurredAt),
    addUtcDays(startOfUtcDay(maximumOccurredAt), 1),
  );
}

export function resolvePreviousDashboardDateRange(period: DashboardDateRange): DashboardDateRange | null {
  if (!period.startInclusive || !period.endExclusive) {
    return null;
  }

  const duration = period.endExclusive.getTime() - period.startInclusive.getTime();

  if (duration <= 0) {
    throw new RangeError("O periodo atual deve possuir duracao positiva.");
  }

  return buildRange(
    period.filter,
    new Date(period.startInclusive.getTime() - duration),
    new Date(period.startInclusive),
  );
}

export function resolveUtcCivilDateRange(date: string) {
  const startInclusive = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(startInclusive.getTime()) || startInclusive.toISOString().slice(0, 10) !== date) {
    throw new RangeError("Data civil UTC invalida.");
  }

  return {
    startInclusive,
    endExclusive: addUtcDays(startInclusive, 1),
  };
}

export function countUtcDays(startInclusive: Date, endExclusive: Date) {
  const duration = endExclusive.getTime() - startInclusive.getTime();

  if (duration <= 0 || duration % UTC_DAY_IN_MS !== 0) {
    throw new RangeError("O intervalo deve conter dias UTC completos e possuir duracao positiva.");
  }

  return duration / UTC_DAY_IN_MS;
}

function buildRange(
  filter: DashboardDateFilterId,
  startInclusive: Date,
  endExclusive: Date,
): DashboardDateRange {
  return {
    filter,
    startInclusive,
    endExclusive,
    dayCount: countUtcDays(startInclusive, endExclusive),
  };
}

function assertValidDate(date: Date, message: string) {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(message);
  }
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addUtcDays(date: Date, days: number) {
  return new Date(date.getTime() + days * UTC_DAY_IN_MS);
}
