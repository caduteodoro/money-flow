"use client";

import { useActionState } from "react";

import { assignTransactionCategoryAction } from "@/app/transactions/actions";
import { initialTransactionActionState } from "@/app/transactions/transaction-action-state";

type CategoryOption = { id: string; label: string };

export function CategoryAssignmentForm({
  transactionId,
  categoryId,
  options,
}: {
  transactionId: string;
  categoryId: string | null;
  options: CategoryOption[];
}) {
  const [state, action, pending] = useActionState(assignTransactionCategoryAction, initialTransactionActionState);

  return (
    <form action={action} className="min-w-52">
      <input type="hidden" name="transactionId" value={transactionId} />
      <div className="flex items-center gap-2">
        <select
          aria-label="Categoria da transacao"
          className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 disabled:opacity-60"
          defaultValue={categoryId ?? ""}
          disabled={pending || options.length === 0}
          name="categoryId"
          required
        >
          <option value="" disabled>Sem categoria</option>
          {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
        <button
          className="min-h-10 rounded-lg bg-brand-teal px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending || options.length === 0}
          type="submit"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
      {state.message ? (
        <p aria-live="polite" className={`mt-1 text-xs ${state.status === "error" ? "text-rose-700" : "text-emerald-700"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
