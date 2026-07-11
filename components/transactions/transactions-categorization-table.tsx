import type { TransactionListItem } from "@/lib/transactions";
import { CategoryAssignmentForm } from "@/components/transactions/category-assignment-form";

type CategoryOption = { id: string; label: string };

export function TransactionsCategorizationTable({ transactions, options }: { transactions: TransactionListItem[]; options: CategoryOption[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[940px] text-sm">
        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
          <tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Descricao</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3 text-right">Valor</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.length ? transactions.map((transaction) => (
            <tr key={transaction.id} className="align-top">
              <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(transaction.occurredAt)}</td>
              <td className="max-w-72 px-4 py-4 font-medium text-brand-navy"><span className="block truncate">{transaction.description}</span></td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDirection(transaction.direction)}</td>
              <td className="px-4 py-3">
                {!transaction.category ? <span className="mb-2 inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">Sem categoria</span> : <p className="mb-2 text-xs text-slate-500">Atual: {transaction.category.parentName ? `${transaction.category.parentName} / ` : ""}{transaction.category.name}</p>}
                <CategoryAssignmentForm transactionId={transaction.id} categoryId={transaction.category?.id ?? null} options={options} />
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums">{formatCurrency(transaction.amountCents)}</td>
            </tr>
          )) : <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Nenhuma transacao encontrada neste filtro.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(date: Date) { return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date); }
function formatCurrency(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100); }
function formatDirection(direction: string) { return ({ INCOME: "Entrada", EXPENSE: "Saida", TRANSFER: "Transferencia", REVERSAL: "Estorno" } as Record<string, string>)[direction] ?? direction; }
