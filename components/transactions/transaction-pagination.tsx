import { ChevronLeft, ChevronRight } from "lucide-react";

import { LinkButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildTransactionsUrl } from "@/lib/transactions";
import type { TransactionFilters, TransactionPagination as Pagination } from "@/lib/transactions";

export function TransactionPagination({ filters, pagination }: { filters: TransactionFilters; pagination: Pagination }) {
  if (pagination.totalItems === 0) return null;

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Página <strong className="text-foreground">{pagination.page}</strong> de <strong className="text-foreground">{pagination.totalPages}</strong> · {pagination.totalItems} {pagination.totalItems === 1 ? "transação" : "transações"}
        </p>
        <div className="flex gap-2">
          {pagination.hasPreviousPage ? (
            <LinkButton href={buildTransactionsUrl({ ...filters, page: pagination.page - 1 })} variant="outline">
              <ChevronLeft aria-hidden="true" /> Anterior
            </LinkButton>
          ) : null}
          {pagination.hasNextPage ? (
            <LinkButton href={buildTransactionsUrl({ ...filters, page: pagination.page + 1 })} variant="outline">
              Próxima <ChevronRight aria-hidden="true" />
            </LinkButton>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
