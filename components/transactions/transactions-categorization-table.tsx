import { CategoryAssignmentForm } from "@/components/transactions/category-assignment-form";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TransactionListItem } from "@/lib/transactions";

type CategoryOption = { id: string; label: string };

export function TransactionsCategorizationTable({ transactions, options, highlightedTransactionId }: { transactions: TransactionListItem[]; options: CategoryOption[]; highlightedTransactionId?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="min-w-[940px]">
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length ? transactions.map((transaction) => (
            <TableRow key={transaction.id} className={transaction.id === highlightedTransactionId ? "bg-primary/5 outline-2 -outline-offset-2 outline-primary" : ""}>
              <TableCell>{formatDate(transaction.occurredAt)}</TableCell>
              <TableCell className="max-w-72 font-medium">
                {transaction.id === highlightedTransactionId ? <Badge className="mb-1 block w-fit" variant="secondary">Transação selecionada</Badge> : null}
                <span className="block truncate">{transaction.description}</span>
              </TableCell>
              <TableCell>{formatDirection(transaction.direction)}</TableCell>
              <TableCell>
                {!transaction.category ? (
                  <Badge className="mb-2 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" variant="secondary">Sem categoria</Badge>
                ) : (
                  <p className="mb-2 text-xs text-muted-foreground">Atual: {transaction.category.parentName ? `${transaction.category.parentName} / ` : ""}{transaction.category.name}</p>
                )}
                <CategoryAssignmentForm transactionId={transaction.id} categoryId={transaction.category?.id ?? null} options={options} />
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(transaction.amountCents)}</TableCell>
            </TableRow>
          )) : (
            <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhuma transação encontrada neste filtro.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function formatDate(date: Date) { return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date); }
function formatCurrency(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100); }
function formatDirection(direction: string) { return ({ INCOME: "Entrada", EXPENSE: "Saída", TRANSFER: "Transferência", REVERSAL: "Estorno" } as Record<string, string>)[direction] ?? direction; }
