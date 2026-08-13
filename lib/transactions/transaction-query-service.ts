import "server-only";

import { Prisma } from "@prisma/client";

import { resolveUserDashboardDateRange } from "@/lib/dashboard/dashboard-service";
import { resolveUtcCivilDateRange } from "@/lib/dashboard/date-filters";
import { prisma } from "@/lib/db/prisma";
import {
  calculateTransactionPagination,
  TRANSACTION_PAGE_SIZE,
} from "@/lib/transactions/transaction-filters";
import type { TransactionFilters } from "@/lib/transactions/transaction-filters";
import type {
  ActiveTransactionFilter,
  FilteredTransactionResult,
  TransactionListItem,
} from "@/lib/transactions/transaction-types";

type OwnedCategory = {
  id: string;
  name: string;
  parentId: string | null;
  parent: { name: string } | null;
  children: { id: string }[];
};

export async function listFilteredUserTransactions(input: {
  userId: string;
  filters: TransactionFilters;
  now?: Date;
}): Promise<FilteredTransactionResult> {
  if (!input.userId) {
    return { ok: false, reason: "RESOURCE_NOT_FOUND" };
  }

  const category = input.filters.categoryId
    ? await findOwnedCategory(input.userId, input.filters.categoryId)
    : null;

  if (input.filters.categoryId && !category) {
    return { ok: false, reason: "RESOURCE_NOT_FOUND" };
  }

  if (input.filters.transactionId) {
    const transaction = await prisma.transaction.findFirst({
      where: { id: input.filters.transactionId, userId: input.userId },
      select: { id: true },
    });

    if (!transaction) {
      return { ok: false, reason: "RESOURCE_NOT_FOUND" };
    }
  }

  const dateRange = input.filters.date
    ? resolveUtcCivilDateRange(input.filters.date)
    : input.filters.period
      ? await resolveUserDashboardDateRange(input.userId, input.filters.period, input.now)
      : null;
  const where = buildTransactionWhere(input.userId, input.filters, category, dateRange);

  const [totalItems, totalUserTransactions, descriptionContext] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.count({ where: { userId: input.userId } }),
    input.filters.descriptionHash
      ? prisma.transaction.findFirst({
          where: { userId: input.userId, descriptionHash: input.filters.descriptionHash },
          select: { normalizedDescription: true },
          orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        })
      : Promise.resolve(null),
  ]);
  const paginationResult = calculateTransactionPagination(totalItems, input.filters.page);

  if (!paginationResult.ok) {
    return { ok: false, reason: "INVALID_PAGE" };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    select: {
      id: true,
      occurredAt: true,
      description: true,
      amountCents: true,
      direction: true,
      categorizationSource: true,
      category: {
        select: {
          id: true,
          name: true,
          parentId: true,
          parent: { select: { name: true } },
        },
      },
    },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    skip: (input.filters.page - 1) * TRANSACTION_PAGE_SIZE,
    take: TRANSACTION_PAGE_SIZE,
  });

  return {
    ok: true,
    data: {
      transactions: transactions.map(toTransactionListItem),
      filters: input.filters,
      activeFilters: buildActiveFilters(
        input.filters,
        category,
        descriptionContext?.normalizedDescription ?? null,
        dateRange,
      ),
      pagination: paginationResult.pagination,
      totalUserTransactions,
    },
  };
}

async function findOwnedCategory(userId: string, categoryId: string): Promise<OwnedCategory | null> {
  return prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: {
      id: true,
      name: true,
      parentId: true,
      parent: { select: { name: true } },
      children: {
        where: { userId },
        select: { id: true },
      },
    },
  });
}

function buildTransactionWhere(
  userId: string,
  filters: TransactionFilters,
  category: OwnedCategory | null,
  dateRange: { startInclusive: Date | null; endExclusive: Date | null } | null,
): Prisma.TransactionWhereInput {
  return {
    userId,
    ...(dateRange?.startInclusive && dateRange.endExclusive
      ? {
          occurredAt: {
            gte: dateRange.startInclusive,
            lt: dateRange.endExclusive,
          },
        }
      : {}),
    ...(filters.direction ? { direction: filters.direction } : {}),
    ...(filters.filter === "categorized" ? { categoryId: { not: null } } : {}),
    ...(filters.filter === "uncategorized" ? { categoryId: null } : {}),
    ...(category
      ? {
          categoryId: category.parentId === null
            ? { in: [category.id, ...category.children.map((child) => child.id)] }
            : category.id,
        }
      : {}),
    ...(filters.descriptionHash ? { descriptionHash: filters.descriptionHash } : {}),
    ...(filters.transactionId ? { id: filters.transactionId } : {}),
  };
}

function toTransactionListItem(
  transaction: Prisma.TransactionGetPayload<{
    select: {
      id: true;
      occurredAt: true;
      description: true;
      amountCents: true;
      direction: true;
      categorizationSource: true;
      category: {
        select: {
          id: true;
          name: true;
          parentId: true;
          parent: { select: { name: true } };
        };
      };
    };
  }>,
): TransactionListItem {
  return {
    id: transaction.id,
    occurredAt: transaction.occurredAt,
    description: transaction.description,
    amountCents: transaction.amountCents,
    direction: transaction.direction,
    categorizationSource: transaction.categorizationSource,
    category: transaction.category
      ? {
          id: transaction.category.id,
          name: transaction.category.name,
          parentId: transaction.category.parentId,
          parentName: transaction.category.parent?.name ?? null,
        }
      : null,
  };
}

function buildActiveFilters(
  filters: TransactionFilters,
  category: OwnedCategory | null,
  normalizedDescription: string | null,
  dateRange: { startInclusive: Date | null; endExclusive: Date | null } | null,
): ActiveTransactionFilter[] {
  const active: ActiveTransactionFilter[] = [];

  if (filters.period) {
    active.push({
      key: "period",
      label: "Periodo",
      value: formatPeriod(filters.period, dateRange),
      removable: filters.period !== "imported-period",
    });
  }

  if (filters.date) {
    active.push({ key: "date", label: "Data", value: formatUtcDate(filters.date), removable: true });
  }

  if (filters.direction) {
    active.push({
      key: "direction",
      label: "Direcao",
      value: directionLabels[filters.direction],
      removable: true,
    });
  }

  if (filters.filter !== "all") {
    active.push({
      key: "filter",
      label: "Categorizacao",
      value: filters.filter === "categorized" ? "Categorizadas" : "Sem categoria",
      removable: true,
    });
  }

  if (category) {
    active.push({
      key: "categoryId",
      label: category.parentId === null ? "Categoria raiz" : "Subcategoria",
      value: category.parent ? `${category.parent.name} / ${category.name}` : category.name,
      removable: true,
    });
  }

  if (filters.descriptionHash) {
    active.push({
      key: "descriptionHash",
      label: "Descricao normalizada",
      value: normalizedDescription?.trim() || "Descricao selecionada",
      removable: true,
    });
  }

  if (filters.transactionId) {
    active.push({
      key: "transactionId",
      label: "Alvo",
      value: "Transacao especifica",
      removable: true,
    });
  }

  return active;
}

const directionLabels = {
  INCOME: "Entradas",
  EXPENSE: "Saidas",
  TRANSFER: "Transferencias",
  REVERSAL: "Estornos",
} as const;

function formatPeriod(
  period: NonNullable<TransactionFilters["period"]>,
  dateRange: { startInclusive: Date | null; endExclusive: Date | null } | null,
) {
  const labels = {
    "imported-period": "Todo o periodo importado",
    "last-30-days": "Ultimos 30 dias",
    "current-month": "Mes atual",
    "previous-month": "Mes anterior",
  } as const;
  const range = formatDateRange(dateRange);
  return range ? `${labels[period]} (${range})` : labels[period];
}

function formatDateRange(dateRange: { startInclusive: Date | null; endExclusive: Date | null } | null) {
  if (!dateRange?.startInclusive || !dateRange.endExclusive) return null;

  const start = formatDate(dateRange.startInclusive);
  const end = formatDate(new Date(dateRange.endExclusive.getTime() - 1));
  return start === end ? start : `${start} a ${end}`;
}

function formatUtcDate(date: string) {
  return formatDate(new Date(`${date}T00:00:00.000Z`));
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
