"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ListFilter, Pencil, Plus } from "lucide-react";

import { CreateChildCategoryForm } from "@/components/categories/create-child-category-form";
import { EditCategoryForm } from "@/components/categories/edit-category-form";
import { Button } from "@/components/ui/button";
import type { CategoryNavigationNode } from "@/lib/categories";
import { buildTransactionsUrl } from "@/lib/transactions/transaction-filters";

export function CategoryCard({ category, isChild = false }: { category: CategoryNavigationNode; isChild?: boolean }) {
  const [activeForm, setActiveForm] = useState<"edit" | "child" | null>(null);

  return (
    <article className={`rounded-xl border bg-white ${isChild ? "border-slate-200" : "border-teal-100 shadow-soft"}`}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between lg:p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isChild ? <ChevronRight className="size-4 shrink-0 text-brand-teal" aria-hidden="true" /> : null}
            <h3 className="truncate font-bold text-brand-navy">{category.name}</h3>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {isChild
              ? `${category.directExpenseCount} ${category.directExpenseCount === 1 ? "despesa" : "despesas"}`
              : `${category.children.length} ${category.children.length === 1 ? "subcategoria" : "subcategorias"} · ${category.totalExpenseCount} ${category.totalExpenseCount === 1 ? "despesa" : "despesas"} na hierarquia`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-navy transition hover:border-teal-200 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            href={buildTransactionsUrl({
              period: "imported-period",
              direction: "EXPENSE",
              categoryId: category.id,
            })}
          >
            <ListFilter className="size-4" aria-hidden="true" />
            Ver despesas
          </Link>
          <Button onClick={() => setActiveForm(activeForm === "edit" ? null : "edit")} type="button" variant="secondary">
            <Pencil className="size-4" aria-hidden="true" />
            Editar
          </Button>
          {!isChild ? (
            <Button onClick={() => setActiveForm(activeForm === "child" ? null : "child")} type="button" variant="ghost">
              <Plus className="size-4" aria-hidden="true" />
              Adicionar subcategoria
            </Button>
          ) : null}
        </div>
      </div>

      {activeForm ? (
        <div className="border-t border-slate-100 p-4 lg:p-5">
          {activeForm === "edit" ? (
            <EditCategoryForm categoryId={category.id} currentName={category.name} />
          ) : (
            <CreateChildCategoryForm parentCategoryId={category.id} />
          )}
        </div>
      ) : null}
    </article>
  );
}
