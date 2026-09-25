import type { TransactionDirection } from "@prisma/client";

import type {
  DashboardDateFilterId,
  DashboardDrillThroughTarget,
} from "@/lib/dashboard/dashboard-types";
import { parseDashboardDateFilter } from "@/lib/dashboard/date-filters";
import { parseDescriptionHash } from "@/lib/dashboard/description-groups";

export const TRANSACTION_PAGE_SIZE = 25;

const allowedParameters = new Set([
  "period",
  "date",
  "direction",
  "filter",
  "categoryId",
  "descriptionHash",
  "transactionId",
  "page",
]);
const identifierPattern = /^[A-Za-z0-9_-]{1,128}$/;
const utcDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const directionByParameter = {
  income: "INCOME",
  expense: "EXPENSE",
  transfer: "TRANSFER",
  reversal: "REVERSAL",
} as const satisfies Record<string, TransactionDirection>;

const parameterByDirection = {
  INCOME: "income",
  EXPENSE: "expense",
  TRANSFER: "transfer",
  REVERSAL: "reversal",
} as const satisfies Record<TransactionDirection, string>;

export type TransactionCategorizationFilter = "all" | "categorized" | "uncategorized";

export type TransactionFilters = {
  period?: DashboardDateFilterId;
  date?: string;
  direction?: TransactionDirection;
  filter: TransactionCategorizationFilter;
  categoryId?: string;
  descriptionHash?: string;
  transactionId?: string;
  page: number;
};

export type TransactionFilterUrlInput = Omit<Partial<TransactionFilters>, "filter" | "page"> & {
  filter?: TransactionCategorizationFilter;
  page?: number;
};

export type TransactionFilterKey =
  | "period"
  | "date"
  | "direction"
  | "filter"
  | "categoryId"
  | "descriptionHash"
  | "transactionId";

export type TransactionSearchParams = Record<string, string | string[] | undefined>;

export type TransactionFilterParseResult =
  | { ok: true; filters: TransactionFilters }
  | {
      ok: false;
      reason:
        | "UNKNOWN_PARAMETER"
        | "DUPLICATE_PARAMETER"
        | "INVALID_PERIOD"
        | "INVALID_DATE"
        | "INVALID_DIRECTION"
        | "INVALID_CATEGORIZATION_FILTER"
        | "INVALID_CATEGORY_ID"
        | "INVALID_DESCRIPTION_HASH"
        | "INVALID_TRANSACTION_ID"
        | "INVALID_PAGE"
        | "INCOMPATIBLE_FILTERS";
    };

export function parseTransactionFilters(searchParams: TransactionSearchParams): TransactionFilterParseResult {
  for (const [key, value] of Object.entries(searchParams)) {
    if (!allowedParameters.has(key)) {
      return { ok: false, reason: "UNKNOWN_PARAMETER" };
    }

    if (Array.isArray(value)) {
      return { ok: false, reason: "DUPLICATE_PARAMETER" };
    }
  }

  const periodValue = readParameter(searchParams, "period");
  const date = readParameter(searchParams, "date");
  const directionValue = readParameter(searchParams, "direction");
  const filterValue = readParameter(searchParams, "filter");
  const categoryId = readParameter(searchParams, "categoryId");
  const descriptionHash = readParameter(searchParams, "descriptionHash");
  const transactionId = readParameter(searchParams, "transactionId");
  const pageValue = readParameter(searchParams, "page");

  let period: DashboardDateFilterId | undefined;

  if (periodValue !== undefined) {
    const parsedPeriod = parseDashboardDateFilter(periodValue);

    if (!parsedPeriod.ok) {
      return { ok: false, reason: "INVALID_PERIOD" };
    }

    period = parsedPeriod.filter;
  }

  if (date !== undefined && !isValidUtcDate(date)) {
    return { ok: false, reason: "INVALID_DATE" };
  }

  if (period && date) {
    return { ok: false, reason: "INCOMPATIBLE_FILTERS" };
  }

  if (directionValue !== undefined && !Object.hasOwn(directionByParameter, directionValue)) {
    return { ok: false, reason: "INVALID_DIRECTION" };
  }
  const direction = directionValue === undefined
    ? undefined
    : directionByParameter[directionValue as keyof typeof directionByParameter];

  const filter = filterValue ?? "all";

  if (!isCategorizationFilter(filter)) {
    return { ok: false, reason: "INVALID_CATEGORIZATION_FILTER" };
  }

  if (categoryId !== undefined && !identifierPattern.test(categoryId)) {
    return { ok: false, reason: "INVALID_CATEGORY_ID" };
  }

  if (descriptionHash !== undefined && !parseDescriptionHash(descriptionHash)) {
    return { ok: false, reason: "INVALID_DESCRIPTION_HASH" };
  }

  if (transactionId !== undefined && !identifierPattern.test(transactionId)) {
    return { ok: false, reason: "INVALID_TRANSACTION_ID" };
  }

  const page = pageValue === undefined ? 1 : parsePage(pageValue);

  if (page === null) {
    return { ok: false, reason: "INVALID_PAGE" };
  }

  if (categoryId && filter === "uncategorized") {
    return { ok: false, reason: "INCOMPATIBLE_FILTERS" };
  }

  if (
    transactionId &&
    (date || direction || filterValue !== undefined || categoryId || descriptionHash || pageValue !== undefined)
  ) {
    return { ok: false, reason: "INCOMPATIBLE_FILTERS" };
  }

  if (!period && !date && !transactionId) {
    period = "imported-period";
  }

  return {
    ok: true,
    filters: {
      ...(period ? { period } : {}),
      ...(date ? { date } : {}),
      ...(direction ? { direction } : {}),
      filter,
      ...(categoryId ? { categoryId } : {}),
      ...(descriptionHash ? { descriptionHash: descriptionHash.toLowerCase() } : {}),
      ...(transactionId ? { transactionId } : {}),
      page,
    },
  };
}

export function buildTransactionsUrl(filters: TransactionFilterUrlInput = {}) {
  const parameters = new URLSearchParams();

  if (filters.period) parameters.set("period", filters.period);
  if (filters.date) parameters.set("date", filters.date);
  if (filters.direction) parameters.set("direction", parameterByDirection[filters.direction]);
  if (filters.filter && filters.filter !== "all") parameters.set("filter", filters.filter);
  if (filters.categoryId) parameters.set("categoryId", filters.categoryId);
  if (filters.descriptionHash) parameters.set("descriptionHash", filters.descriptionHash.toLowerCase());
  if (filters.transactionId) parameters.set("transactionId", filters.transactionId);
  if (filters.page && filters.page !== 1) parameters.set("page", String(filters.page));

  const query = parameters.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export function buildDashboardDrillThroughUrl(
  target: DashboardDrillThroughTarget,
  period: DashboardDateFilterId,
) {
  if (target.kind === "ROOT_CATEGORY") {
    return buildTransactionsUrl({
      period,
      direction: "EXPENSE",
      categoryId: target.rootCategoryId,
    });
  }

  if (target.kind === "UNCATEGORIZED") {
    return buildTransactionsUrl({ period, direction: "EXPENSE", filter: "uncategorized" });
  }

  if (target.kind === "NORMALIZED_DESCRIPTION") {
    const descriptionHash = parseDescriptionHash(target.descriptionHash);
    return descriptionHash
      ? buildTransactionsUrl({
          period,
          direction: "EXPENSE",
          descriptionHash,
        })
      : null;
  }

  if (target.kind === "TRANSACTION") {
    return buildTransactionsUrl({ period, transactionId: target.transactionId });
  }

  if (target.kind === "DAY") {
    return buildTransactionsUrl({ date: target.date, direction: "EXPENSE" });
  }

  return null;
}

export function calculateTransactionPagination(totalItems: number, page: number) {
  if (!Number.isSafeInteger(totalItems) || totalItems < 0) {
    throw new RangeError("O total de transacoes deve ser um inteiro nao negativo.");
  }

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new RangeError("A pagina deve ser um inteiro positivo.");
  }

  const totalPages = Math.ceil(totalItems / TRANSACTION_PAGE_SIZE);

  if (page > 1 && (totalPages === 0 || page > totalPages)) {
    return { ok: false as const, reason: "INVALID_PAGE" as const };
  }

  return {
    ok: true as const,
    pagination: {
      page,
      pageSize: TRANSACTION_PAGE_SIZE,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  };
}

export function updateTransactionFilters(
  current: TransactionFilters,
  changes: Partial<Record<TransactionFilterKey, string | TransactionDirection | TransactionCategorizationFilter | null>> & {
    page?: number;
  },
) {
  const next: TransactionFilterUrlInput = { ...current, page: changes.page ?? 1 };

  for (const [key, value] of Object.entries(changes)) {
    if (key === "page") continue;

    if (value === null || value === undefined || value === "") {
      delete next[key as TransactionFilterKey];
      continue;
    }

    Object.assign(next, { [key]: value });
  }

  if (changes.filter === null) next.filter = "all";
  if (changes.date) delete next.period;
  if (changes.period) delete next.date;
  if (changes.filter === "uncategorized") delete next.categoryId;
  if (changes.categoryId) next.filter = next.filter === "uncategorized" ? "all" : next.filter;

  return buildTransactionsUrl(next);
}

export function removeTransactionFilter(current: TransactionFilters, key: TransactionFilterKey) {
  return updateTransactionFilters(current, { [key]: null });
}

function readParameter(searchParams: TransactionSearchParams, key: string) {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

function isCategorizationFilter(value: string): value is TransactionCategorizationFilter {
  return value === "all" || value === "categorized" || value === "uncategorized";
}

function isValidUtcDate(value: string) {
  if (!utcDatePattern.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function parsePage(value: string) {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
