import { FileUp } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export function DashboardEmptyState() {
  return (
    <section className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-soft">
      <div className="flex flex-col gap-5 border-l-4 border-brand-teal p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Nenhuma transacao ainda</p>
          <h2 className="mt-2 text-xl font-bold text-brand-navy sm:text-2xl">
            Importe um CSV ficticio para ligar o GPS financeiro.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
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
