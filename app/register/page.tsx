import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { RegisterForm } from "@/app/register/register-form";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

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
            <UserPlus className="mb-4 size-6 text-brand-teal" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-brand-navy">Criar conta</h1>
            <p className="mt-2 text-sm text-slate-500">
              Crie seu acesso para comecar com dados isolados por usuario.
            </p>
          </div>

          <RegisterForm />

          <p className="mt-5 text-center text-sm text-slate-600">
            Ja tem conta?{" "}
            <Link className="font-semibold text-brand-teal hover:text-teal-700" href="/login">
              Entrar
            </Link>
          </p>
        </div>
      </section>

      <section className="hidden items-center justify-center p-8 lg:flex">
        <div className="max-w-lg rounded-lg bg-white p-8 shadow-soft">
          <p className="text-sm font-semibold text-brand-teal">Privacidade no desenho</p>
          <h2 className="mt-3 text-3xl font-bold text-brand-navy">
            Cada dado financeiro no seu lugar.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            A base separa usuarios, contas, importacoes, transacoes, categorias, sessoes e logs de
            auditoria desde o inicio do MVP.
          </p>
        </div>
      </section>
    </main>
  );
}
