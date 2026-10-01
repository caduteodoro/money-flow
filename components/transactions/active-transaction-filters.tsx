import Link from "next/link";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { removeTransactionFilter } from "@/lib/transactions";
import type { ActiveTransactionFilter, TransactionFilters } from "@/lib/transactions";

export function ActiveTransactionFilters({ filters, items }: { filters: TransactionFilters; items: ActiveTransactionFilter[] }) {
  const hasRemovableFilters = items.some((item) => item.removable);

  return (
    <Card size="sm">
      <CardHeader className="sm:grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Filtros ativos</CardTitle>
          <CardDescription>Cada resultado combina os filtros abaixo no servidor.</CardDescription>
        </div>
        {hasRemovableFilters ? <LinkButton href="/transactions" variant="ghost">Limpar todos</LinkButton> : null}
      </CardHeader>
      <CardContent>
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.key}>
              <Badge className="h-auto max-w-full gap-2 py-1.5" variant="outline">
                <span className="min-w-0 truncate"><strong>{item.label}:</strong> {item.value}</span>
                {item.removable ? (
                  <Link aria-label={`Remover filtro ${item.label}`} className="rounded-full p-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={removeTransactionFilter(filters, item.key)}>
                    <X aria-hidden="true" />
                  </Link>
                ) : null}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
