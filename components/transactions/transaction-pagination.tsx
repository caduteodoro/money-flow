import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buildTransactionsUrl } from "@/lib/transactions";
import type { TransactionFilters, TransactionPagination as Pagination } from "@/lib/transactions";

export function TransactionPagination({
  filters,
  pagination,
}: {
  filters: TransactionFilters;
  pagination: Pagination;
}) {
  if (pagination.totalItems === 0) return null;

  return (
    <nav aria-label="Paginacao de transacoes" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        Pagina <strong>{pagination.page}</strong> de <strong>{pagination.totalPages}</strong> · {pagination.totalItems} {pagination.totalItems === 1 ? "transacao" : "transacoes"}
      </p>
      <div className="flex gap-2">
        {pagination.hasPreviousPage ? (
          <PaginationLink href={buildTransactionsUrl({ ...filters, page: pagination.page - 1 })}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Anterior
          </PaginationLink>
        ) : null}
        {pagination.hasNextPage ? (
          <PaginationLink href={buildTransactionsUrl({ ...filters, page: pagination.page + 1 })}>
            Proxima <ChevronRight className="size-4" aria-hidden="true" />
          </PaginationLink>
        ) : null}
      </div>
    </nav>
  );
}

function PaginationLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-navy transition hover:border-teal-200 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" href={href}>
      {children}
    </Link>
  );
}
