import { CategoriesEmptyState } from "@/components/categories/categories-empty-state";
import { CategoryList } from "@/components/categories/category-list";
import { CreateCategoryForm } from "@/components/categories/create-category-form";
import { CategoryRuleSection } from "@/components/category-rules/category-rule-section";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { listUserCategoriesForNavigation } from "@/lib/categories";
import { listUserCategoryRules } from "@/lib/category-rules";
import { buildTransactionsUrl } from "@/lib/transactions";

export default async function CategoriesPage() {
  const user = await requireCurrentUser();
  const [result, rulesResult] = await Promise.all([
    listUserCategoriesForNavigation(user.id),
    listUserCategoryRules(user.id),
  ]);
  const categories = result.ok ? result.data.categories : [];
  const options = categories.flatMap((parent) => [{ id: parent.id, label: parent.name }, ...parent.children.map((child) => ({ id: child.id, label: `  └─ ${child.name}` }))]);

  return (
    <div className="min-h-screen bg-brand-surface">
      <Sidebar activeItem="categories" />
      <main className="lg:pl-72">
        <Topbar eyebrow="Organizacao" periodLabel="Categorias" title="Categorias" user={user} />
        <div className="space-y-6 px-5 py-6 lg:px-8">
          <section className="rounded-xl border border-teal-100 bg-white p-5 shadow-soft lg:p-6">
            <p className="text-sm font-semibold text-brand-teal">Organize sua rota</p>
            <h1 className="mt-2 text-xl font-bold text-brand-navy sm:text-2xl">
              Organize suas transacoes com categorias e subcategorias.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Crie categorias principais, subcategorias e regras simples para organizar suas transacoes.
            </p>
          </section>

          <Card>
            <CardHeader>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Nova categoria</p>
                <h2 className="mt-1 text-lg font-bold text-brand-navy">Criar categoria principal</h2>
              </div>
            </CardHeader>
            <CardBody>
              <CreateCategoryForm />
            </CardBody>
          </Card>

          {result.ok ? (
            <Card>
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Revisao rapida</p>
                  <h2 className="mt-1 text-lg font-bold text-brand-navy">Despesas sem categoria</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {result.data.uncategorizedExpenseCount} {result.data.uncategorizedExpenseCount === 1 ? "despesa precisa" : "despesas precisam"} de revisao no periodo importado.
                  </p>
                </div>
                <LinkButton
                  className="shrink-0"
                  href={buildTransactionsUrl({
                    period: "imported-period",
                    direction: "EXPENSE",
                    filter: "uncategorized",
                  })}
                >
                  Ver despesas sem categoria
                </LinkButton>
              </CardBody>
            </Card>
          ) : null}

          {!result.ok ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {result.message}
            </p>
          ) : categories.length === 0 ? (
            <CategoriesEmptyState />
          ) : (
            <CategoryList categories={categories} />
          )}
          <CategoryRuleSection rules={rulesResult.ok ? rulesResult.data : []} options={options} />
          {!rulesResult.ok ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{rulesResult.message}</p> : null}
        </div>
      </main>
    </div>
  );
}
