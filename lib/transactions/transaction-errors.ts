import type { TransactionCategorizationResult, TransactionErrorCode } from "@/lib/transactions/transaction-types";

const messages: Record<TransactionErrorCode, string> = {
  VALIDATION_ERROR: "Revise os campos informados.",
  TRANSACTION_NOT_FOUND: "Transacao nao encontrada.",
  CATEGORY_NOT_FOUND: "Categoria nao encontrada.",
  UNEXPECTED_ERROR: "Nao foi possivel atualizar a categoria da transacao.",
};

export function transactionFailure(
  code: TransactionErrorCode,
  fieldErrors?: Record<string, string[]>,
): TransactionCategorizationResult {
  return { ok: false, code, message: messages[code], ...(fieldErrors ? { fieldErrors } : {}) };
}
