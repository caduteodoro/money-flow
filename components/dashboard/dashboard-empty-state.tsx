import { FileUp } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export function DashboardEmptyState() {
  return (
    <section className="rounded-lg border border-teal-100 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-teal">Nenhuma transacao ainda</p>
          <h2 className="mt-2 text-xl font-bold text-brand-navy">
            Importe um CSV ficticio para ligar o GPS financeiro.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Depois da primeira importacao, esta tela mostra KPIs reais, saldo do periodo e as
            ultimas transacoes vinculadas ao seu usuario.
          </p>
        </div>

        <LinkButton href="/import" className="shrink-0">
          <FileUp className="size-4" aria-hidden="true" />
          Importar CSV
        </LinkButton>
      </div>
    </section>
  );
}
