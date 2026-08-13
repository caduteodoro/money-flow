import type { DashboardTransactionItem } from "@/lib/dashboard/dashboard-types";

type TransactionsTableProps = {
  transactions: DashboardTransactionItem[];
};

const directionLabels: Record<DashboardTransactionItem["direction"], string> = {
  INCOME: "Entrada",
  EXPENSE: "Saida",
  TRANSFER: "Transferencia",
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

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-28 px-4 py-3">Data</th>
            <th className="px-4 py-3">Descricao</th>
            <th className="w-32 px-4 py-3">Tipo</th>
            <th className="w-40 px-4 py-3 text-right">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <tr key={transaction.id} className="bg-white transition hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(transaction.occurredAt)}
                </td>
                <td className="min-w-0 px-4 py-3">
                  <span className="block max-w-full truncate font-medium text-brand-navy">
                    {transaction.description}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-xs font-bold ${directionClasses[transaction.direction]}`}
                  >
                    {directionLabels[transaction.direction]}
                  </span>
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${amountClasses[transaction.direction]}`}
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
  }).format(Math.abs(amountCents) / 100);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}
