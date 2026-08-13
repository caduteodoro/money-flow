import Link from "next/link";
import { X } from "lucide-react";

import { LinkButton } from "@/components/ui/button";
import { removeTransactionFilter } from "@/lib/transactions";
import type { ActiveTransactionFilter, TransactionFilters } from "@/lib/transactions";

export function ActiveTransactionFilters({
  filters,
  items,
}: {
  filters: TransactionFilters;
  items: ActiveTransactionFilter[];
}) {
  const hasRemovableFilters = items.some((item) => item.removable);

  return (
    <section aria-labelledby="active-filters-title" className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="active-filters-title" className="text-sm font-bold text-brand-navy">Filtros ativos</h2>
          <p className="mt-1 text-xs text-slate-500">Cada resultado combina os filtros abaixo no servidor.</p>
        </div>
        {hasRemovableFilters ? (
          <LinkButton className="shrink-0" href="/transactions" variant="ghost">Limpar todos</LinkButton>
        ) : null}
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.key} className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="min-w-0 truncate">
              <span className="font-bold">{item.label}:</span> {item.value}
            </span>
            {item.removable ? (
              <Link
                aria-label={`Remover filtro ${item.label}`}
                className="grid size-7 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-white hover:text-brand-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                href={removeTransactionFilter(filters, item.key)}
              >
                <X className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
