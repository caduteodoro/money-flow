import type { CategorizationSource, TransactionDirection } from "@prisma/client";

import type {
  TransactionFilterKey,
  TransactionFilters,
} from "@/lib/transactions/transaction-filters";

export type TransactionListItem = {
  id: string;
  occurredAt: Date;
  description: string;
  amountCents: number;
  direction: TransactionDirection;
  category: {
    id: string;
    name: string;
    parentId: string | null;
    parentName: string | null;
  } | null;
  categorizationSource: CategorizationSource;
};

export type AssignTransactionCategoryInput = {
  userId: string;
  transactionId: string;
  categoryId: string;
};

export type TransactionErrorCode =
  | "VALIDATION_ERROR"
  | "TRANSACTION_NOT_FOUND"
  | "CATEGORY_NOT_FOUND"
  | "UNEXPECTED_ERROR";

export type TransactionCategorizationResult =
  | {
      ok: true;
      data: {
        transactionId: string;
        categoryId: string;
        categorizationSource: "USER_MANUAL";
      };
    }
  | {
      ok: false;
      code: TransactionErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export type TransactionPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ActiveTransactionFilter = {
  key: TransactionFilterKey;
  label: string;
  value: string;
  removable: boolean;
};

export type FilteredTransactionPage = {
  transactions: TransactionListItem[];
  filters: TransactionFilters;
  activeFilters: ActiveTransactionFilter[];
  pagination: TransactionPagination;
  totalUserTransactions: number;
};

export type FilteredTransactionResult =
  | { ok: true; data: FilteredTransactionPage }
  | { ok: false; reason: "RESOURCE_NOT_FOUND" | "INVALID_PAGE" };
