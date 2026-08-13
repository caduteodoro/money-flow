import "server-only";

import { CategorizationSource } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { transactionFailure } from "@/lib/transactions/transaction-errors";
import type { AssignTransactionCategoryInput } from "@/lib/transactions/transaction-types";
import { assignTransactionCategorySchema } from "@/lib/transactions/transaction-validation";

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
