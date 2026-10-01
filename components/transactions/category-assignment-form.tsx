"use client";

import { useActionState } from "react";

import { assignTransactionCategoryAction } from "@/app/transactions/actions";
import { initialTransactionActionState } from "@/app/transactions/transaction-action-state";
import { Button } from "@/components/ui/button";

type CategoryOption = { id: string; label: string };

export function CategoryAssignmentForm({ transactionId, categoryId, options }: { transactionId: string; categoryId: string | null; options: CategoryOption[] }) {
  const [state, action, pending] = useActionState(assignTransactionCategoryAction, initialTransactionActionState);

  return (
    <form action={action} className="min-w-52">
      <input type="hidden" name="transactionId" value={transactionId} />
      <div className="flex items-center gap-2">
        <select
          aria-label="Categoria da transação"
          className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          defaultValue={categoryId ?? ""}
          disabled={pending || options.length === 0}
          name="categoryId"
          required
        >
          <option value="" disabled>Sem categoria</option>
          {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
        <Button disabled={pending || options.length === 0} size="sm" type="submit">
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      {state.message ? (
        <p aria-live="polite" className={`mt-1 text-xs ${state.status === "error" ? "text-destructive" : "text-emerald-700"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
