import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardDateFilterId, DashboardTransactionItem } from "@/lib/dashboard/dashboard-types";
import { cn } from "@/lib/utils";
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

const directionVariants: Record<
  DashboardTransactionItem["direction"],
  "secondary" | "destructive" | "outline"
> = {
  INCOME: "secondary",
  EXPENSE: "destructive",
  TRANSFER: "outline",
  REVERSAL: "outline",
};

const amountClasses: Record<DashboardTransactionItem["direction"], string> = {
  INCOME: "text-primary",
  EXPENSE: "text-destructive",
  TRANSFER: "text-muted-foreground",
  REVERSAL: "text-foreground",
};

export function TransactionsTable({ transactions, activeFilter }: TransactionsTableProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      {transactions.length > 0 ? (
        <>
          <ul className="flex flex-col gap-3 xl:hidden" aria-label="Últimas transações">
            {transactions.map((transaction) => (
              <li className="min-w-0 rounded-xl border bg-muted/50 p-4" key={transaction.id}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold" title={transaction.description}>{transaction.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(transaction.occurredAt)} · {formatCategory(transaction)}</p>
                  </div>
                  <p className={cn("shrink-0 text-sm font-semibold tabular-nums", amountClasses[transaction.direction])}>
                    {formatCurrency(transaction.amountCents)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={directionVariants[transaction.direction]}>
                    {directionLabels[transaction.direction]}
                  </Badge>
                  <TransactionLink activeFilter={activeFilter} transactionId={transaction.id} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-xl border xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-48">Categoria</TableHead>
                  <TableHead className="w-32">Tipo</TableHead>
                  <TableHead className="w-36 text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(transaction.occurredAt)}</TableCell>
                    <TableCell className="min-w-0">
                      <span className="block truncate font-medium" title={transaction.description}>{transaction.description}</span>
                      <TransactionLink activeFilter={activeFilter} transactionId={transaction.id} />
                    </TableCell>
                    <TableCell>
                      <span className="block truncate text-muted-foreground" title={formatCategory(transaction)}>{formatCategory(transaction)}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={directionVariants[transaction.direction]}>
                        {directionLabels[transaction.direction]}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("whitespace-nowrap text-right font-semibold tabular-nums", amountClasses[transaction.direction])}>
                      {formatCurrency(transaction.amountCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <Alert>
          <AlertTitle>Nenhuma transação encontrada</AlertTitle>
          <AlertDescription>Não existem movimentações para este período.</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <LinkButton href={buildTransactionsUrl({ period: activeFilter })} variant="outline">
          Ver todas as transações
        </LinkButton>
      </div>
    </div>
  );
}

function TransactionLink({ activeFilter, transactionId }: { activeFilter: DashboardDateFilterId; transactionId: string }) {
  return (
    <Link
      aria-label="Localizar esta transação na lista completa"
      className="inline-flex min-h-8 items-center text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
