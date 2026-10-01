"use client";

import { useState } from "react";
import { ChevronRight, ListFilter, Pencil, Plus } from "lucide-react";

import { CreateChildCategoryForm } from "@/components/categories/create-child-category-form";
import { EditCategoryForm } from "@/components/categories/edit-category-form";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryNavigationNode } from "@/lib/categories";
import { buildTransactionsUrl } from "@/lib/transactions/transaction-filters";

export function CategoryCard({ category, isChild = false }: { category: CategoryNavigationNode; isChild?: boolean }) {
  const [activeForm, setActiveForm] = useState<"edit" | "child" | null>(null);

  return (
    <Card size={isChild ? "sm" : "default"}>
      <CardHeader className="sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            {isChild ? <ChevronRight className="text-primary" aria-hidden="true" /> : null}
            <span className="truncate">{category.name}</span>
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {isChild
              ? `${category.directExpenseCount} ${category.directExpenseCount === 1 ? "despesa" : "despesas"}`
              : `${category.children.length} ${category.children.length === 1 ? "subcategoria" : "subcategorias"} · ${category.totalExpenseCount} ${category.totalExpenseCount === 1 ? "despesa" : "despesas"} na hierarquia`}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
          <LinkButton href={buildTransactionsUrl({ period: "imported-period", direction: "EXPENSE", categoryId: category.id })} variant="outline">
            <ListFilter aria-hidden="true" /> Ver despesas
          </LinkButton>
          <Button onClick={() => setActiveForm(activeForm === "edit" ? null : "edit")} type="button" variant="secondary">
            <Pencil aria-hidden="true" /> Editar
          </Button>
          {!isChild ? (
            <Button onClick={() => setActiveForm(activeForm === "child" ? null : "child")} type="button" variant="ghost">
              <Plus aria-hidden="true" /> Adicionar subcategoria
            </Button>
          ) : null}
        </div>
      </CardHeader>
      {activeForm ? (
        <CardFooter className="block">
          {activeForm === "edit" ? (
            <EditCategoryForm categoryId={category.id} currentName={category.name} />
          ) : (
            <CreateChildCategoryForm parentCategoryId={category.id} />
          )}
        </CardFooter>
      ) : null}
      {!activeForm ? <CardContent className="hidden" /> : null}
    </Card>
  );
}
