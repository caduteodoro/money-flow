import { describe, expect, it } from "vitest";

import {
  buildDashboardDrillThroughUrl,
  buildTransactionsUrl,
  calculateTransactionPagination,
  parseTransactionFilters,
  removeTransactionFilter,
  TRANSACTION_PAGE_SIZE,
  updateTransactionFilters,
} from "@/lib/transactions/transaction-filters";

const descriptionHash = "a".repeat(64);

function params(query: string) {
  return Object.fromEntries(new URLSearchParams(query));
}

function parse(query: string) {
  return parseTransactionFilters(params(query));
}

describe("transaction filters", () => {
  it("defaults an absent filter set to the imported period, all categories, and page one", () => {
    expect(parse("")).toEqual({
      ok: true,
      filters: { period: "imported-period", filter: "all", page: 1 },
    });
  });

  it.each(["imported-period", "last-30-days", "current-month", "previous-month"])(
    "accepts the %s period preset",
    (period) => {
      expect(parse(`period=${period}`)).toEqual({
        ok: true,
        filters: { period, filter: "all", page: 1 },
      });
    },
  );

  it("rejects an invalid preset instead of correcting it", () => {
    expect(parse("period=last-31-days")).toEqual({ ok: false, reason: "INVALID_PERIOD" });
  });

  it("accepts a real UTC civil date and rejects malformed or impossible dates", () => {
    expect(parse("date=2026-08-13")).toEqual({
      ok: true,
      filters: { date: "2026-08-13", filter: "all", page: 1 },
    });
    expect(parse("date=13-08-2026")).toEqual({ ok: false, reason: "INVALID_DATE" });
    expect(parse("date=2026-02-30")).toEqual({ ok: false, reason: "INVALID_DATE" });
  });

  it("rejects period and date together", () => {
    expect(parse("period=current-month&date=2026-08-13")).toEqual({
      ok: false,
      reason: "INCOMPATIBLE_FILTERS",
    });
  });

  it.each([
    ["income", "INCOME"],
    ["expense", "EXPENSE"],
    ["transfer", "TRANSFER"],
    ["reversal", "REVERSAL"],
  ] as const)("maps direction=%s only to enum %s", (parameter, direction) => {
    expect(parse(`direction=${parameter}`)).toEqual({
      ok: true,
      filters: { period: "imported-period", direction, filter: "all", page: 1 },
    });
  });

  it("rejects an unknown direction", () => {
    expect(parse("direction=positive")).toEqual({ ok: false, reason: "INVALID_DIRECTION" });
  });

  it.each(["all", "categorized", "uncategorized"] as const)(
    "accepts filter=%s",
    (filter) => {
      expect(parse(`filter=${filter}`)).toEqual({
        ok: true,
        filters: { period: "imported-period", filter, page: 1 },
      });
    },
  );

  it("accepts safe category identifiers but rejects invalid syntax and contradictory uncategorized state", () => {
    expect(parse("categoryId=cat_safe-01")).toEqual({
      ok: true,
      filters: { period: "imported-period", filter: "all", categoryId: "cat_safe-01", page: 1 },
    });
    expect(parse("categoryId=%2Fprivate")).toEqual({ ok: false, reason: "INVALID_CATEGORY_ID" });
    expect(parse("categoryId=cat_safe-01&filter=uncategorized")).toEqual({
      ok: false,
      reason: "INCOMPATIBLE_FILTERS",
    });
  });

  it("accepts only a SHA-256 hexadecimal description hash and normalizes its case", () => {
    expect(parse(`descriptionHash=${descriptionHash.toUpperCase()}`)).toEqual({
      ok: true,
      filters: {
        period: "imported-period",
        filter: "all",
        descriptionHash,
        page: 1,
      },
    });
    expect(parse("descriptionHash=raw-description")).toEqual({
      ok: false,
      reason: "INVALID_DESCRIPTION_HASH",
    });
  });

  it("keeps a transaction a specific target, allowing only period provenance", () => {
    expect(parse("period=current-month&transactionId=transaction-01")).toEqual({
      ok: true,
      filters: {
        period: "current-month",
        filter: "all",
        transactionId: "transaction-01",
        page: 1,
      },
    });
    expect(parse("transactionId=transaction-01&direction=expense")).toEqual({
      ok: false,
      reason: "INCOMPATIBLE_FILTERS",
    });
    expect(parse("transactionId=transaction-01&page=1")).toEqual({
      ok: false,
      reason: "INCOMPATIBLE_FILTERS",
    });
  });

  it("accepts positive numbered pages and rejects zero, negative, nonnumeric, and unsafe pages", () => {
    expect(parse("page=2")).toEqual({
      ok: true,
      filters: { period: "imported-period", filter: "all", page: 2 },
    });
    expect(parse("page=0")).toEqual({ ok: false, reason: "INVALID_PAGE" });
    expect(parse("page=-1")).toEqual({ ok: false, reason: "INVALID_PAGE" });
    expect(parse("page=two")).toEqual({ ok: false, reason: "INVALID_PAGE" });
    expect(parse("page=999999999999999999999")).toEqual({ ok: false, reason: "INVALID_PAGE" });
  });

  it("rejects unknown and duplicated parameters", () => {
    expect(parse("sort=amount")).toEqual({ ok: false, reason: "UNKNOWN_PARAMETER" });
    expect(parseTransactionFilters({ direction: ["income", "expense"] })).toEqual({
      ok: false,
      reason: "DUPLICATE_PARAMETER",
    });
  });

  it("serializes deterministically without defaults or a raw description", () => {
    const url = buildTransactionsUrl({
      page: 3,
      descriptionHash,
      categoryId: "category-01",
      filter: "categorized",
      direction: "EXPENSE",
      date: "2026-08-13",
    });

    expect(url).toBe(
      `/transactions?date=2026-08-13&direction=expense&filter=categorized&categoryId=category-01&descriptionHash=${descriptionHash}&page=3`,
    );
    expect(url).not.toContain("Synthetic Coffee Shop");
    expect(buildTransactionsUrl({ filter: "all", page: 1 })).toBe("/transactions");
  });

  it("preserves compatible filters, resets the page, and removes one filter at a time", () => {
    const parsed = parse("period=current-month&direction=expense&filter=categorized&page=4");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(updateTransactionFilters(parsed.filters, { categoryId: "category-01" })).toBe(
      "/transactions?period=current-month&direction=expense&filter=categorized&categoryId=category-01",
    );
    expect(removeTransactionFilter(parsed.filters, "direction")).toBe(
      "/transactions?period=current-month&filter=categorized",
    );
    expect(removeTransactionFilter(parsed.filters, "filter")).toBe(
      "/transactions?period=current-month&direction=expense",
    );
  });

  it("makes UI transitions between incompatible date and category states explicit", () => {
    const categorized = parse("period=current-month&categoryId=category-01");
    expect(categorized.ok).toBe(true);
    if (!categorized.ok) return;

    expect(updateTransactionFilters(categorized.filters, { date: "2026-08-13" })).toBe(
      "/transactions?date=2026-08-13&categoryId=category-01",
    );
    expect(updateTransactionFilters(categorized.filters, { filter: "uncategorized" })).toBe(
      "/transactions?period=current-month&filter=uncategorized",
    );
  });

  it("maps typed dashboard targets without exposing normalized descriptions or fragile root sets", () => {
    expect(
      buildDashboardDrillThroughUrl(
        { kind: "NORMALIZED_DESCRIPTION", descriptionHash, normalizedDescription: "Synthetic Coffee Shop" },
        "current-month",
      ),
    ).toBe(`/transactions?period=current-month&direction=expense&descriptionHash=${descriptionHash}`);
    expect(
      buildDashboardDrillThroughUrl(
        { kind: "NORMALIZED_DESCRIPTION", descriptionHash: null, normalizedDescription: "Synthetic Coffee Shop" },
        "current-month",
      ),
    ).toBeNull();
    expect(
      buildDashboardDrillThroughUrl({ kind: "ROOT_CATEGORY_SET", rootCategoryIds: ["one", "two"] }, "current-month"),
    ).toBeNull();
  });
});

describe("transaction pagination", () => {
  it("uses a fixed page size and represents zero results explicitly", () => {
    expect(TRANSACTION_PAGE_SIZE).toBe(25);
    expect(calculateTransactionPagination(0, 1)).toEqual({
      ok: true,
      pagination: {
        page: 1,
        pageSize: 25,
        totalItems: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });
  });

  it("calculates first and final pages without inventing a client page size", () => {
    expect(calculateTransactionPagination(26, 1)).toEqual({
      ok: true,
      pagination: expect.objectContaining({ page: 1, totalPages: 2, hasPreviousPage: false, hasNextPage: true }),
    });
    expect(calculateTransactionPagination(26, 2)).toEqual({
      ok: true,
      pagination: expect.objectContaining({ page: 2, totalPages: 2, hasPreviousPage: true, hasNextPage: false }),
    });
  });

  it("rejects pages beyond the total and invalid calculation inputs", () => {
    expect(calculateTransactionPagination(0, 2)).toEqual({ ok: false, reason: "INVALID_PAGE" });
    expect(calculateTransactionPagination(26, 3)).toEqual({ ok: false, reason: "INVALID_PAGE" });
    expect(() => calculateTransactionPagination(-1, 1)).toThrow(RangeError);
    expect(() => calculateTransactionPagination(1, 0)).toThrow(RangeError);
  });
});
