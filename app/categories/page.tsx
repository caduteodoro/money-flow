import { CategoriesEmptyState } from "@/components/categories/categories-empty-state";
import { CategoryList } from "@/components/categories/category-list";
import { CreateCategoryForm } from "@/components/categories/create-category-form";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { listUserCategories } from "@/lib/categories";

export default async function CategoriesPage() {
  const user = await requireCurrentUser();
  const result = await listUserCategories(user.id);
  const categories = result.ok ? result.data : [];

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
              Crie categorias principais e um nivel de subcategorias. A categorizacao das transacoes entra no proximo bloco.
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

          {!result.ok ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {result.message}
            </p>
          ) : categories.length === 0 ? (
            <CategoriesEmptyState />
          ) : (
            <CategoryList categories={categories} />
          )}
        </div>
      </main>
    </div>
  );
}
