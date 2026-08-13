"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-amber-200 bg-white p-6 shadow-soft sm:p-8" role="alert">
        <span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-brand-teal">Dashboard indisponível</p>
        <h1 className="mt-2 text-2xl font-bold text-brand-navy">Não foi possível carregar o cockpit financeiro.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Nenhum detalhe financeiro foi exposto. Tente carregar novamente; se o problema continuar, volte mais tarde.
        </p>
        <Button className="mt-5" onClick={reset} type="button">Tentar novamente</Button>
      </section>
    </main>
  );
}
