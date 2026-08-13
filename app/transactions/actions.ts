"use server";

import { revalidatePath } from "next/cache";

import type { TransactionActionState } from "@/app/transactions/transaction-action-state";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { assignTransactionCategory } from "@/lib/transactions";

export async function assignTransactionCategoryAction(
  _previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const user = await requireCurrentUser();
  const result = await assignTransactionCategory({
    userId: user.id,
    transactionId: readField(formData, "transactionId"),
    categoryId: readField(formData, "categoryId"),
  });

  if (!result.ok) return { status: "error", message: result.message };
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/categories");
  return { status: "success", message: "Categoria atualizada com sucesso." };
}

function readField(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}
