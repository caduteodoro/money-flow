import { CalendarDays, FileUp } from "lucide-react";

import { LinkButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type DashboardEmptyStateProps = {
  variant?: "no-data" | "empty-period";
  filterLabel?: string;
  periodRangeLabel?: string | null;
};

export function DashboardEmptyState({ variant = "no-data", filterLabel = "período selecionado", periodRangeLabel }: DashboardEmptyStateProps) {
  const isEmptyPeriod = variant === "empty-period";

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {isEmptyPeriod ? "Nenhuma transação no filtro" : "Nenhuma transação ainda"}
          </p>
          <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
            {isEmptyPeriod ? "O periodo selecionado nao tem transacoes importadas." : "Importe um CSV ficticio para ligar o GPS financeiro."}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {isEmptyPeriod
              ? `O filtro ${filterLabel} não encontrou movimentações${periodRangeLabel ? ` entre ${periodRangeLabel}` : ""}. Os seus dados importados continuam disponíveis em outros períodos.`
              : "Depois da primeira importação, esta tela mostra KPIs reais, resultado do período e as últimas transações vinculadas ao seu usuário."}
          </p>
        </div>
        <LinkButton className="shrink-0" href={isEmptyPeriod ? "/dashboard?period=imported-period" : "/import"}>
          {isEmptyPeriod ? <CalendarDays aria-hidden="true" /> : <FileUp aria-hidden="true" />}
          {isEmptyPeriod ? "Ver período importado" : "Importar CSV"}
        </LinkButton>
      </CardContent>
    </Card>
  );
}
