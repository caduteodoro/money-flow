import { CalendarDays, FileUp } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

type DashboardEmptyStateProps = {
  variant?: "no-data" | "empty-period";
  filterLabel?: string;
  periodRangeLabel?: string | null;
};

export function DashboardEmptyState({
  variant = "no-data",
  filterLabel = "periodo selecionado",
  periodRangeLabel,
}: DashboardEmptyStateProps) {
  const isEmptyPeriod = variant === "empty-period";

  return (
    <section className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-soft">
      <div className="flex flex-col gap-5 border-l-4 border-brand-teal p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">
            {isEmptyPeriod ? "Nenhuma transacao no filtro" : "Nenhuma transacao ainda"}
          </p>
          <h2 className="mt-2 text-xl font-bold text-brand-navy sm:text-2xl">
            {isEmptyPeriod
              ? "O periodo selecionado nao tem transacoes importadas."
              : "Importe um CSV ficticio para ligar o GPS financeiro."}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {isEmptyPeriod
              ? `O filtro ${filterLabel} nao encontrou movimentacoes${
                  periodRangeLabel ? ` entre ${periodRangeLabel}` : ""
                }. Os seus dados importados continuam disponiveis em outros periodos.`
              : "Depois da primeira importacao, esta tela mostra KPIs reais, saldo do periodo e as ultimas transacoes vinculadas ao seu usuario."}
          </p>
        </div>

        <LinkButton href={isEmptyPeriod ? "/dashboard?period=imported-period" : "/import"} className="shrink-0">
          {isEmptyPeriod ? (
            <CalendarDays className="size-4" aria-hidden="true" />
          ) : (
            <FileUp className="size-4" aria-hidden="true" />
          )}
          {isEmptyPeriod ? "Ver periodo importado" : "Importar CSV"}
        </LinkButton>
      </div>
    </section>
  );
}
