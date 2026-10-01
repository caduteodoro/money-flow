import { CategoriesEmptyState } from "@/components/categories/categories-empty-state";
import { CategoryList } from "@/components/categories/category-list";
import { CreateCategoryForm } from "@/components/categories/create-category-form";
import { CategoryRuleSection } from "@/components/category-rules/category-rule-section";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LinkButton } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const options = categories.flatMap((parent) => [
    { id: parent.id, label: parent.name },
    ...parent.children.map((child) => ({ id: child.id, label: `  └─ ${child.name}` })),
  ]);

  return (
    <AppShell
      activeItem="categories"
      contentClassName="flex flex-col gap-6"
      eyebrow="Organização"
      periodLabel="Categorias"
      title="Categorias"
      user={user}
    >
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Organize sua rota</p>
          <CardTitle className="text-xl sm:text-2xl">Categorias que explicam seus gastos</CardTitle>
          <CardDescription className="max-w-3xl leading-6">
            Crie categorias principais, subcategorias e regras simples para organizar suas transações.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Nova categoria</p>
          <CardTitle>Criar categoria principal</CardTitle>
          <CardDescription>Use nomes curtos e consistentes para facilitar filtros e análises.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateCategoryForm />
        </CardContent>
      </Card>

      {result.ok ? (
        <Card>
          <CardHeader>
            <CardTitle>Despesas sem categoria</CardTitle>
            <CardDescription>
              {result.data.uncategorizedExpenseCount} {result.data.uncategorizedExpenseCount === 1 ? "despesa precisa" : "despesas precisam"} de revisão no período importado.
            </CardDescription>
            <CardAction>
              <LinkButton
                href={buildTransactionsUrl({
                  period: "imported-period",
                  direction: "EXPENSE",
                  filter: "uncategorized",
                })}
                size="sm"
              >
                Revisar agora
              </LinkButton>
            </CardAction>
          </CardHeader>
        </Card>
      ) : null}

      {!result.ok ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar categorias</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : categories.length === 0 ? (
        <CategoriesEmptyState />
      ) : (
        <CategoryList categories={categories} />
      )}

      <CategoryRuleSection rules={rulesResult.ok ? rulesResult.data : []} options={options} />

      {!rulesResult.ok ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar regras</AlertTitle>
          <AlertDescription>{rulesResult.message}</AlertDescription>
        </Alert>
      ) : null}
    </AppShell>
  );
}
