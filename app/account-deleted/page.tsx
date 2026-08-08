import { CheckCircle2 } from "lucide-react";

import { LinkButton } from "@/components/ui/button";

export default function AccountDeletedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-surface px-5">
      <section className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
        <CheckCircle2 className="mx-auto size-10 text-brand-teal" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-brand-navy">Solicitacao concluida</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          A conta associada a sessao foi excluida. Nenhum detalhe identificavel e exibido nesta confirmacao.
        </p>
        <LinkButton className="mt-6" href="/">Voltar ao inicio</LinkButton>
      </section>
    </main>
  );
}
