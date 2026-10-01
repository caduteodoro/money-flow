import { FilterX, FolderSearch, ListX } from "lucide-react";

import { LinkButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { TransactionFilters } from "@/lib/transactions";

export function TransactionsEmptyState({ filters, totalUserTransactions }: { filters: TransactionFilters; totalUserTransactions: number }) {
  const content = resolveEmptyContent(filters, totalUserTransactions);
  const Icon = content.icon;

  return (
    <Card className="border-dashed text-center">
      <CardContent className="p-7">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary"><Icon aria-hidden="true" /></span>
        <h2 className="mt-4 text-lg font-semibold">{content.title}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{content.description}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <LinkButton href={content.primaryHref}>{content.primaryLabel}</LinkButton>
          {totalUserTransactions > 0 ? <LinkButton href="/dashboard" variant="outline">Voltar ao dashboard</LinkButton> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function resolveEmptyContent(filters: TransactionFilters, totalUserTransactions: number) {
  if (totalUserTransactions === 0) return { icon: ListX, title: "Você ainda não tem transações importadas.", description: "Importe um CSV fictício para começar a organizar e consultar suas movimentações.", primaryHref: "/import", primaryLabel: "Abrir importação" };
  if (filters.filter === "uncategorized") return { icon: FolderSearch, title: filters.direction === "EXPENSE" ? "Não há despesas sem categoria neste recorte." : "Não há transações sem categoria neste recorte.", description: "As transações permanecem disponíveis. Remova os filtros para consultar outros resultados.", primaryHref: "/transactions", primaryLabel: "Limpar filtros" };
  if (filters.categoryId) return { icon: FolderSearch, title: "Esta categoria não possui transações neste recorte.", description: "A categoria foi validada para o seu usuário, mas a combinação atual não encontrou movimentações.", primaryHref: "/transactions", primaryLabel: "Limpar filtros" };
  if (filters.period || filters.date) return { icon: FilterX, title: "O período selecionado não possui transações correspondentes.", description: "Seus dados continuam preservados; altere ou remova os filtros para ampliar a consulta.", primaryHref: "/transactions", primaryLabel: "Ver período importado" };
  return { icon: FilterX, title: "Nenhuma transação corresponde aos filtros.", description: "Remova um filtro individualmente ou limpe todos para ampliar os resultados.", primaryHref: "/transactions", primaryLabel: "Limpar filtros" };
}
