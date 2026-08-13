import Link from "next/link";

import type { DashboardDateFilterId, DashboardTransactionItem } from "@/lib/dashboard/dashboard-types";
import { buildTransactionsUrl } from "@/lib/transactions";

type TransactionsTableProps = {
  transactions: DashboardTransactionItem[];
  activeFilter: DashboardDateFilterId;
};

const directionLabels: Record<DashboardTransactionItem["direction"], string> = {
  INCOME: "Entrada",
  EXPENSE: "Saída",
  TRANSFER: "Transferência",
  REVERSAL: "Estorno",
};

const directionClasses: Record<DashboardTransactionItem["direction"], string> = {
  INCOME: "bg-emerald-50 text-emerald-700",
  EXPENSE: "bg-rose-50 text-rose-700",
  TRANSFER: "bg-sky-50 text-sky-700",
  REVERSAL: "bg-amber-50 text-amber-700",
};

const amountClasses: Record<DashboardTransactionItem["direction"], string> = {
  INCOME: "text-emerald-700",
  EXPENSE: "text-rose-700",
  TRANSFER: "text-sky-700",
  REVERSAL: "text-amber-700",
};

export function TransactionsTable({ transactions, activeFilter }: TransactionsTableProps) {
  return (
    <div className="min-w-0 space-y-4">
      {transactions.length > 0 ? (
        <>
          <ul className="space-y-3 xl:hidden" aria-label="Últimas transações">
            {transactions.map((transaction) => (
              <li className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-4" key={transaction.id}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-brand-navy" title={transaction.description}>{transaction.description}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(transaction.occurredAt)} · {formatCategory(transaction)}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-bold tabular-nums ${amountClasses[transaction.direction]}`}>
                    {formatCurrency(transaction.amountCents)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${directionClasses[transaction.direction]}`}>
                    {directionLabels[transaction.direction]}
                  </span>
                  <TransactionLink activeFilter={activeFilter} transactionId={transaction.id} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-xl border border-slate-200 xl:block">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-28 px-4 py-3">Data</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="w-48 px-4 py-3">Categoria</th>
                  <th className="w-32 px-4 py-3">Tipo</th>
                  <th className="w-36 px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="bg-white transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(transaction.occurredAt)}</td>
                    <td className="min-w-0 px-4 py-3">
                      <span className="block truncate font-medium text-brand-navy" title={transaction.description}>{transaction.description}</span>
                      <TransactionLink activeFilter={activeFilter} transactionId={transaction.id} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="block truncate text-slate-600" title={formatCategory(transaction)}>{formatCategory(transaction)}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-xs font-bold ${directionClasses[transaction.direction]}`}>
                        {directionLabels[transaction.direction]}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${amountClasses[transaction.direction]}`}>
                      {formatCurrency(transaction.amountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Nenhuma transação encontrada para este período.
        </p>
      )}

      <div className="flex justify-end">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-brand-navy transition hover:border-teal-200 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          href={buildTransactionsUrl({ period: activeFilter })}
        >
          Ver todas as transações
        </Link>
      </div>
    </div>
  );
}

function TransactionLink({ activeFilter, transactionId }: { activeFilter: DashboardDateFilterId; transactionId: string }) {
  return (
    <Link
      aria-label="Localizar esta transação na lista completa"
      className="inline-flex min-h-8 items-center text-xs font-bold text-brand-teal underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
      href={buildTransactionsUrl({ period: activeFilter, transactionId })}
    >
      Localizar transação
    </Link>
  );
}

function formatCategory(transaction: DashboardTransactionItem) {
  if (transaction.direction === "TRANSFER" || transaction.direction === "REVERSAL" || transaction.direction === "INCOME") {
    return "Não aplicável";
  }

  if (!transaction.category) return "Sem categoria";
  if (transaction.category.id === transaction.category.rootCategoryId) return transaction.category.name;
  return `${transaction.category.rootCategoryName} › ${transaction.category.name}`;
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(amountCents) / 100);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(date));
}
