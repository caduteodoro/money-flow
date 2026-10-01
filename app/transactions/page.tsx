import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ActiveTransactionFilters } from "@/components/transactions/active-transaction-filters";
import { TransactionPagination } from "@/components/transactions/transaction-pagination";
import { TransactionsCategorizationTable } from "@/components/transactions/transactions-categorization-table";
import { TransactionsEmptyState } from "@/components/transactions/transactions-empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { listUserCategories } from "@/lib/categories";
import {
  listFilteredUserTransactions,
  parseTransactionFilters,
  updateTransactionFilters,
  type TransactionSearchParams,
} from "@/lib/transactions";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams?: Promise<TransactionSearchParams>;
}) {
  const parsedFilters = parseTransactionFilters((await searchParams) ?? {});

  if (!parsedFilters.ok) notFound();

  const user = await requireCurrentUser();
  const [transactionsResult, categoriesResult] = await Promise.all([
    listFilteredUserTransactions({ userId: user.id, filters: parsedFilters.filters }),
    listUserCategories(user.id),
  ]);

  if (!transactionsResult.ok) notFound();

  const transactionPage = transactionsResult.data;
  const options = categoriesResult.ok
    ? categoriesResult.data.flatMap((parent) => [
        { id: parent.id, label: parent.name },
        ...parent.children.map((child) => ({ id: child.id, label: `  └─ ${child.name}` })),
      ])
    : [];

  return (
    <AppShell
      activeItem="transactions"
      contentClassName="flex flex-col gap-6"
      eyebrow="Organização"
      periodLabel="Transações"
      title="Transações"
      user={user}
    >
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Movimentações</p>
          <CardTitle className="text-xl sm:text-2xl">Revise, filtre e categorize com contexto</CardTitle>
          <CardDescription className="max-w-3xl leading-6">
            Filtros são aplicados no servidor e a paginação preserva o recorte. Categorias podem ser criadas e editadas em Categorias.
          </CardDescription>
        </CardHeader>
      </Card>

      <ActiveTransactionFilters filters={transactionPage.filters} items={transactionPage.activeFilters} />

      {!transactionPage.filters.transactionId ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <FilterGroup label="Filtrar por direção">
            <FilterLink active={!transactionPage.filters.direction} href={updateTransactionFilters(transactionPage.filters, { direction: null })}>Todas</FilterLink>
            <FilterLink active={transactionPage.filters.direction === "INCOME"} href={updateTransactionFilters(transactionPage.filters, { direction: "INCOME" })}>Entradas</FilterLink>
            <FilterLink active={transactionPage.filters.direction === "EXPENSE"} href={updateTransactionFilters(transactionPage.filters, { direction: "EXPENSE" })}>Saídas</FilterLink>
            <FilterLink active={transactionPage.filters.direction === "TRANSFER"} href={updateTransactionFilters(transactionPage.filters, { direction: "TRANSFER" })}>Transferências</FilterLink>
            <FilterLink active={transactionPage.filters.direction === "REVERSAL"} href={updateTransactionFilters(transactionPage.filters, { direction: "REVERSAL" })}>Estornos</FilterLink>
          </FilterGroup>
          <FilterGroup label="Filtrar por categorização">
            <FilterLink active={transactionPage.filters.filter === "all"} href={updateTransactionFilters(transactionPage.filters, { filter: "all" })}>Todas</FilterLink>
            <FilterLink active={transactionPage.filters.filter === "categorized"} href={updateTransactionFilters(transactionPage.filters, { filter: "categorized" })}>Categorizadas</FilterLink>
            <FilterLink active={transactionPage.filters.filter === "uncategorized"} href={updateTransactionFilters(transactionPage.filters, { filter: "uncategorized" })}>Sem categoria</FilterLink>
          </FilterGroup>
        </div>
      ) : null}

      {!categoriesResult.ok ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar categorias</AlertTitle>
          <AlertDescription>{categoriesResult.message}</AlertDescription>
        </Alert>
      ) : null}

      {categoriesResult.ok && options.length === 0 ? (
        <Alert>
          <AlertTitle>Nenhuma categoria criada</AlertTitle>
          <AlertDescription>
            Crie uma categoria em <Link className="font-semibold underline" href="/categories">Categorias</Link> antes de categorizar.
          </AlertDescription>
        </Alert>
      ) : null}

      {transactionPage.transactions.length > 0 ? (
        <TransactionsCategorizationTable
          highlightedTransactionId={transactionPage.filters.transactionId}
          transactions={transactionPage.transactions}
          options={options}
        />
      ) : (
        <TransactionsEmptyState
          filters={transactionPage.filters}
          totalUserTransactions={transactionPage.totalUserTransactions}
        />
      )}

      <TransactionPagination filters={transactionPage.filters} pagination={transactionPage.pagination} />
    </AppShell>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <nav aria-label={label} className="flex flex-wrap gap-2">
          {children}
        </nav>
      </CardContent>
    </Card>
  );
}

function FilterLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={buttonVariants({ variant: active ? "default" : "outline", size: "sm" })}
      href={href}
    >
      {children}
    </Link>
  );
}
