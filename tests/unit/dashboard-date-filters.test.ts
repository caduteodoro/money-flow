import { describe, expect, it } from "vitest";

import {
  countUtcDays,
  parseDashboardDateFilter,
  resolveFixedDashboardDateRange,
  resolveImportedPeriodDateRange,
  resolvePreviousDashboardDateRange,
} from "@/lib/dashboard/date-filters";

describe("dashboard date filters", () => {
  it("accepts known presets, defaults only an absent parameter, and rejects an invalid URL preset", () => {
    expect(parseDashboardDateFilter(undefined)).toEqual({ ok: true, filter: "imported-period" });
    expect(parseDashboardDateFilter("current-month")).toEqual({ ok: true, filter: "current-month" });
    expect(parseDashboardDateFilter("")).toEqual({ ok: false, reason: "INVALID_PRESET" });
    expect(parseDashboardDateFilter("last-31-days")).toEqual({ ok: false, reason: "INVALID_PRESET" });
  });

  it("resolves exactly 30 UTC civil dates across a leap-year month boundary", () => {
    const period = resolveFixedDashboardDateRange("last-30-days", new Date("2024-03-01T23:59:59.999Z"));

    expect(period).toEqual({
      filter: "last-30-days",
      startInclusive: new Date("2024-02-01T00:00:00.000Z"),
      endExclusive: new Date("2024-03-02T00:00:00.000Z"),
      dayCount: 30,
    });
  });

  it("keeps last-30-days correct across a year boundary using the injected clock", () => {
    const period = resolveFixedDashboardDateRange("last-30-days", new Date("2026-01-05T08:30:00.000Z"));

    expect(period.startInclusive?.toISOString()).toBe("2025-12-07T00:00:00.000Z");
    expect(period.endExclusive?.toISOString()).toBe("2026-01-06T00:00:00.000Z");
    expect(period.dayCount).toBe(30);
  });

  it("resolves the current month only through the current UTC civil date", () => {
    const period = resolveFixedDashboardDateRange("current-month", new Date("2026-08-12T15:20:00.000Z"));

    expect(period).toEqual({
      filter: "current-month",
      startInclusive: new Date("2026-08-01T00:00:00.000Z"),
      endExclusive: new Date("2026-08-13T00:00:00.000Z"),
      dayCount: 12,
    });
  });

  it("resolves the complete previous month in leap and non-leap Februaries", () => {
    const leap = resolveFixedDashboardDateRange("previous-month", new Date("2024-03-15T12:00:00.000Z"));
    const nonLeap = resolveFixedDashboardDateRange("previous-month", new Date("2025-03-15T12:00:00.000Z"));

    expect(leap.startInclusive?.toISOString()).toBe("2024-02-01T00:00:00.000Z");
    expect(leap.endExclusive?.toISOString()).toBe("2024-03-01T00:00:00.000Z");
    expect(leap.dayCount).toBe(29);
    expect(nonLeap.startInclusive?.toISOString()).toBe("2025-02-01T00:00:00.000Z");
    expect(nonLeap.endExclusive?.toISOString()).toBe("2025-03-01T00:00:00.000Z");
    expect(nonLeap.dayCount).toBe(28);
  });

  it("normalizes the imported period to an exclusive next-day boundary", () => {
    const period = resolveImportedPeriodDateRange(
      new Date("2026-06-10T23:45:00.000Z"),
      new Date("2026-06-12T00:05:00.000Z"),
    );

    expect(period).toEqual({
      filter: "imported-period",
      startInclusive: new Date("2026-06-10T00:00:00.000Z"),
      endExclusive: new Date("2026-06-13T00:00:00.000Z"),
      dayCount: 3,
    });
  });

  it("represents one imported civil date as one complete exclusive interval", () => {
    const period = resolveImportedPeriodDateRange(
      new Date("2026-06-10T01:00:00.000Z"),
      new Date("2026-06-10T23:00:00.000Z"),
    );

    expect(period.startInclusive?.toISOString()).toBe("2026-06-10T00:00:00.000Z");
    expect(period.endExclusive?.toISOString()).toBe("2026-06-11T00:00:00.000Z");
    expect(period.dayCount).toBe(1);
  });

  it("represents total absence of imported transactions explicitly", () => {
    expect(resolveImportedPeriodDateRange(null, null)).toEqual({
      filter: "imported-period",
      startInclusive: null,
      endExclusive: null,
      dayCount: 0,
    });
  });

  it("builds an immediately previous period with the same duration", () => {
    const current = resolveFixedDashboardDateRange("current-month", new Date("2026-08-12T12:00:00.000Z"));
    const previous = resolvePreviousDashboardDateRange(current);

    expect(previous).toEqual({
      filter: "current-month",
      startInclusive: new Date("2026-07-20T00:00:00.000Z"),
      endExclusive: new Date("2026-08-01T00:00:00.000Z"),
      dayCount: 12,
    });
    expect(resolvePreviousDashboardDateRange(resolveImportedPeriodDateRange(null, null))).toBeNull();
  });

  it("accepts only positive intervals composed of complete UTC days", () => {
    expect(countUtcDays(new Date("2026-01-01T00:00:00.000Z"), new Date("2026-01-03T00:00:00.000Z"))).toBe(2);
    expect(() =>
      countUtcDays(new Date("2026-01-01T00:00:00.000Z"), new Date("2026-01-01T00:00:00.000Z")),
    ).toThrow(RangeError);
    expect(() =>
      countUtcDays(new Date("2026-01-01T00:00:00.000Z"), new Date("2026-01-01T12:00:00.000Z")),
    ).toThrow(RangeError);
  });
});
