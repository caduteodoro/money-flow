import "server-only";

import { CategorizationSource } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { transactionFailure } from "@/lib/transactions/transaction-errors";
import type { AssignTransactionCategoryInput, TransactionListItem } from "@/lib/transactions/transaction-types";
import { assignTransactionCategorySchema, listTransactionsSchema } from "@/lib/transactions/transaction-validation";

const TRANSACTION_LIST_LIMIT = 100;

export async function listUserTransactionsForCategorization(input: {
  userId: string;
  uncategorizedOnly?: boolean;
}): Promise<TransactionListItem[]> {
  const parsed = listTransactionsSchema.safeParse(input);
  if (!parsed.success) return [];

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: parsed.data.userId,
      ...(parsed.data.uncategorizedOnly ? { categoryId: null } : {}),
    },
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
    orderBy: { occurredAt: "desc" },
    take: TRANSACTION_LIST_LIMIT,
  });

  return transactions.map((transaction) => ({
    ...transaction,
    category: transaction.category
      ? { ...transaction.category, parentName: transaction.category.parent?.name ?? null, parent: undefined }
      : null,
  })).map(({ category, ...transaction }) => ({
    ...transaction,
    category: category ? {
      id: category.id,
      name: category.name,
      parentId: category.parentId,
      parentName: category.parentName,
    } : null,
  }));
}

export async function assignTransactionCategory(input: AssignTransactionCategoryInput) {
  const parsed = assignTransactionCategorySchema.safeParse(input);
  if (!parsed.success) return transactionFailure("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: parsed.data.transactionId, userId: parsed.data.userId },
      select: { id: true },
    });
    if (!transaction) return transactionFailure("TRANSACTION_NOT_FOUND");

    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, userId: parsed.data.userId },
      select: { id: true },
    });
    if (!category) return transactionFailure("CATEGORY_NOT_FOUND");

    const update = await prisma.transaction.updateMany({
      where: { id: transaction.id, userId: parsed.data.userId },
      data: { categoryId: category.id, categorizationSource: CategorizationSource.USER_MANUAL },
    });
    if (update.count !== 1) return transactionFailure("TRANSACTION_NOT_FOUND");

    return {
      ok: true as const,
      data: { transactionId: transaction.id, categoryId: category.id, categorizationSource: "USER_MANUAL" as const },
    };
  } catch {
    return transactionFailure("UNEXPECTED_ERROR");
  }
}
