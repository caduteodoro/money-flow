import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-brand-surface px-5 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <Link href="/" className="mb-10 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-brand-navy text-sm font-bold text-white">
            MF
          </span>
          <span>
            <span className="block font-bold text-brand-navy">Money Flow</span>
            <span className="block text-xs text-slate-500">Seu GPS financeiro pessoal.</span>
          </span>
        </Link>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-6">
            <LockKeyhole className="mb-4 size-6 text-brand-teal" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-brand-navy">Entrar</h1>
            <p className="mt-2 text-sm text-slate-500">Acesso visual preparado para a Sprint 1.</p>
          </div>

          <form className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">E-mail</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-teal-100"
                placeholder="voce@exemplo.com"
                type="email"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Senha</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-teal-100"
                placeholder="••••••••"
                type="password"
              />
            </label>

            <Button className="w-full" disabled type="button">
              Entrar
            </Button>
          </form>
        </div>
      </section>

      <section className="hidden items-center justify-center p-8 lg:flex">
        <div className="max-w-lg rounded-lg bg-brand-navy p-8 text-white shadow-soft">
          <p className="text-sm font-semibold text-brand-mint">Próxima parada</p>
          <h2 className="mt-3 text-3xl font-bold">Sessão segura e rotas protegidas.</h2>
          <p className="mt-4 leading-7 text-slate-200">
            A autenticação entra depois da fundação, com isolamento por usuário desde o modelo de
            dados.
          </p>
        </div>
      </section>
    </main>
  );
}
