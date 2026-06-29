import type { DashboardTransactionItem } from "@/lib/dashboard/dashboard-types";

type TransactionsTableProps = {
  transactions: DashboardTransactionItem[];
};

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Descricao</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3 text-right">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <tr key={transaction.id} className="bg-white transition hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(transaction.occurredAt)}
                </td>
                <td className="max-w-[360px] px-4 py-3">
                  <span className="block truncate font-medium text-brand-navy">
                    {transaction.description}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                      isExpense(transaction.direction, transaction.amountCents)
                        ? "bg-rose-50 text-rose-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {formatDirection(transaction.direction, transaction.amountCents)}
                  </span>
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${
                    isExpense(transaction.direction, transaction.amountCents)
                      ? "text-rose-700"
                      : "text-emerald-700"
                  }`}
                >
                  {formatCurrency(transaction.amountCents)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                Nenhuma transacao encontrada para este periodo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

function formatDirection(direction: string, amountCents: number) {
  if (direction === "INCOME" || amountCents > 0) {
    return "Entrada";
  }

  if (direction === "EXPENSE" || amountCents < 0) {
    return "Saida";
  }

  if (direction === "TRANSFER") {
    return "Transferencia";
  }

  return "Estorno";
}

function isExpense(direction: string, amountCents: number) {
  return direction === "EXPENSE" || amountCents < 0;
}
