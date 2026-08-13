import { FilterX, FolderSearch, ListX } from "lucide-react";

import { LinkButton } from "@/components/ui/button";
import type { TransactionFilters } from "@/lib/transactions";

export function TransactionsEmptyState({
  filters,
  totalUserTransactions,
}: {
  filters: TransactionFilters;
  totalUserTransactions: number;
}) {
  const content = resolveEmptyContent(filters, totalUserTransactions);
  const Icon = content.icon;

  return (
    <section className="rounded-xl border border-dashed border-teal-200 bg-white p-7 text-center shadow-soft">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-teal-50 text-brand-teal">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-brand-navy">{content.title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">{content.description}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <LinkButton href={content.primaryHref}>{content.primaryLabel}</LinkButton>
        {totalUserTransactions > 0 ? <LinkButton href="/dashboard" variant="secondary">Voltar ao dashboard</LinkButton> : null}
      </div>
    </section>
  );
}

function resolveEmptyContent(filters: TransactionFilters, totalUserTransactions: number) {
  if (totalUserTransactions === 0) {
    return {
      icon: ListX,
      title: "Voce ainda nao tem transacoes importadas.",
      description: "Importe um CSV ficticio para comecar a organizar e consultar suas movimentacoes.",
      primaryHref: "/import",
      primaryLabel: "Abrir importacao",
    };
  }

  if (filters.filter === "uncategorized") {
    const expenseContext = filters.direction === "EXPENSE";

    return {
      icon: FolderSearch,
      title: expenseContext
        ? "Nao ha despesas sem categoria neste recorte."
        : "Nao ha transacoes sem categoria neste recorte.",
      description: "As transacoes permanecem disponiveis. Remova os filtros para consultar outros resultados.",
      primaryHref: "/transactions",
      primaryLabel: "Limpar filtros",
    };
  }

  if (filters.categoryId) {
    return {
      icon: FolderSearch,
      title: "Esta categoria nao possui transacoes neste recorte.",
      description: "A categoria foi validada para o seu usuario, mas a combinacao atual nao encontrou movimentacoes.",
      primaryHref: "/transactions",
      primaryLabel: "Limpar filtros",
    };
  }

  if (filters.period || filters.date) {
    return {
      icon: FilterX,
      title: "O periodo selecionado nao possui transacoes correspondentes.",
      description: "Seus dados continuam preservados; altere ou remova os filtros para ampliar a consulta.",
      primaryHref: "/transactions",
      primaryLabel: "Ver periodo importado",
    };
  }

  return {
    icon: FilterX,
    title: "Nenhuma transacao corresponde aos filtros.",
    description: "Remova um filtro individualmente ou limpe todos para ampliar os resultados.",
    primaryHref: "/transactions",
    primaryLabel: "Limpar filtros",
  };
}
