import Link from "next/link";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { TransactionsCategorizationTable } from "@/components/transactions/transactions-categorization-table";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { listUserCategories } from "@/lib/categories";
import { listUserTransactionsForCategorization } from "@/lib/transactions";

export default async function TransactionsPage({ searchParams }: { searchParams?: Promise<{ filter?: string }> }) {
  const user = await requireCurrentUser();
  const filter = (await searchParams)?.filter === "uncategorized" ? "uncategorized" : "all";
  const [transactions, categoriesResult] = await Promise.all([
    listUserTransactionsForCategorization({ userId: user.id, uncategorizedOnly: filter === "uncategorized" }),
    listUserCategories(user.id),
  ]);
  const options = categoriesResult.ok ? categoriesResult.data.flatMap((parent) => [
    { id: parent.id, label: parent.name },
    ...parent.children.map((child) => ({ id: child.id, label: `  └─ ${child.name}` })),
  ]) : [];

  return (
    <div className="min-h-screen bg-brand-surface">
      <Sidebar activeItem="transactions" />
      <main className="lg:pl-72">
        <Topbar eyebrow="Organizacao" periodLabel="Transacoes" title="Transacoes" user={user} />
        <div className="space-y-6 px-5 py-6 lg:px-8">
          <section className="rounded-xl border border-teal-100 bg-white p-5 shadow-soft lg:p-6">
            <h1 className="text-xl font-bold text-brand-navy sm:text-2xl">Visualize suas movimentacoes e organize as categorias.</h1>
            <p className="mt-2 text-sm text-slate-600">A lista mostra ate 100 transacoes mais recentes. Categorias podem ser criadas e editadas em Categorias.</p>
          </section>
          <div className="flex gap-2" aria-label="Filtro de transacoes">
            <FilterLink active={filter === "all"} href="/transactions">Todas</FilterLink>
            <FilterLink active={filter === "uncategorized"} href="/transactions?filter=uncategorized">Sem categoria</FilterLink>
          </div>
          {!categoriesResult.ok ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{categoriesResult.message}</p> : null}
          {categoriesResult.ok && options.length === 0 ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Crie uma categoria em <Link className="font-bold underline" href="/categories">Categorias</Link> antes de categorizar.</p> : null}
          <TransactionsCategorizationTable transactions={transactions} options={options} />
        </div>
      </main>
    </div>
  );
}

function FilterLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return <Link className={`rounded-lg px-4 py-2 text-sm font-bold ${active ? "bg-brand-teal text-white" : "border border-slate-300 bg-white text-slate-700"}`} href={href}>{children}</Link>;
}
