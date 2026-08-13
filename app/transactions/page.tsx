import Link from "next/link";
import { notFound } from "next/navigation";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ActiveTransactionFilters } from "@/components/transactions/active-transaction-filters";
import { TransactionPagination } from "@/components/transactions/transaction-pagination";
import { TransactionsCategorizationTable } from "@/components/transactions/transactions-categorization-table";
import { TransactionsEmptyState } from "@/components/transactions/transactions-empty-state";
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
    <div className="min-h-screen bg-brand-surface">
      <Sidebar activeItem="transactions" />
      <main className="lg:pl-72">
        <Topbar eyebrow="Organizacao" periodLabel="Transacoes" title="Transacoes" user={user} />
        <div className="space-y-6 px-5 py-6 lg:px-8">
          <section className="rounded-xl border border-teal-100 bg-white p-5 shadow-soft lg:p-6">
            <h1 className="text-xl font-bold text-brand-navy sm:text-2xl">Visualize suas movimentacoes e organize as categorias.</h1>
            <p className="mt-2 text-sm text-slate-600">Os filtros sao aplicados no servidor e a lista e paginada sem perder o contexto. Categorias podem ser criadas e editadas em Categorias.</p>
          </section>

          <ActiveTransactionFilters filters={transactionPage.filters} items={transactionPage.activeFilters} />

          {!transactionPage.filters.transactionId ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <FilterGroup label="Filtrar por direcao">
                <FilterLink active={!transactionPage.filters.direction} href={updateTransactionFilters(transactionPage.filters, { direction: null })}>Todas</FilterLink>
                <FilterLink active={transactionPage.filters.direction === "INCOME"} href={updateTransactionFilters(transactionPage.filters, { direction: "INCOME" })}>Entradas</FilterLink>
                <FilterLink active={transactionPage.filters.direction === "EXPENSE"} href={updateTransactionFilters(transactionPage.filters, { direction: "EXPENSE" })}>Saidas</FilterLink>
                <FilterLink active={transactionPage.filters.direction === "TRANSFER"} href={updateTransactionFilters(transactionPage.filters, { direction: "TRANSFER" })}>Transferencias</FilterLink>
                <FilterLink active={transactionPage.filters.direction === "REVERSAL"} href={updateTransactionFilters(transactionPage.filters, { direction: "REVERSAL" })}>Estornos</FilterLink>
              </FilterGroup>
              <FilterGroup label="Filtrar por categorizacao">
                <FilterLink active={transactionPage.filters.filter === "all"} href={updateTransactionFilters(transactionPage.filters, { filter: "all" })}>Todas</FilterLink>
                <FilterLink active={transactionPage.filters.filter === "categorized"} href={updateTransactionFilters(transactionPage.filters, { filter: "categorized" })}>Categorizadas</FilterLink>
                <FilterLink active={transactionPage.filters.filter === "uncategorized"} href={updateTransactionFilters(transactionPage.filters, { filter: "uncategorized" })}>Sem categoria</FilterLink>
              </FilterGroup>
            </div>
          ) : null}

          {!categoriesResult.ok ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{categoriesResult.message}</p> : null}
          {categoriesResult.ok && options.length === 0 ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Crie uma categoria em <Link className="font-bold underline" href="/categories">Categorias</Link> antes de categorizar.</p> : null}

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
        </div>
      </main>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <nav aria-label={label} className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </nav>
  );
}

function FilterLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
        active
          ? "bg-brand-teal text-white"
          : "border border-slate-300 bg-white text-slate-700 hover:border-teal-300"
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}
