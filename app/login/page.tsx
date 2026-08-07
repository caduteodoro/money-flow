import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { LoginForm } from "@/app/login/login-form";
import { getCurrentUser } from "@/lib/auth/current-user";

type LoginPageProps = {
  searchParams: Promise<{
    registration?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    redirect("/dashboard");
  }

  const showRegistrationNotice = params.registration === "submitted";

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
            <p className="mt-2 text-sm text-slate-500">
              Acesse sua rota financeira com uma sessao segura.
            </p>
          </div>

          {showRegistrationNotice ? (
            <p className="mb-4 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800" role="status">
              Se os dados puderem ser cadastrados, voce ja podera entrar com suas credenciais.
            </p>
          ) : null}

          <LoginForm />

          <p className="mt-5 text-center text-sm text-slate-600">
            Ainda nao tem conta?{" "}
            <Link className="font-semibold text-brand-teal hover:text-teal-700" href="/register">
              Criar conta
            </Link>
          </p>
        </div>
      </section>

      <section className="hidden items-center justify-center p-8 lg:flex">
        <div className="max-w-lg rounded-lg bg-brand-navy p-8 text-white shadow-soft">
          <p className="text-sm font-semibold text-brand-mint">Proxima parada</p>
          <h2 className="mt-3 text-3xl font-bold">Sessao segura e rotas protegidas.</h2>
          <p className="mt-4 leading-7 text-slate-200">
            A autenticacao do MVP usa cookie HTTP-only, token com hash no banco e isolamento por
            usuario desde o primeiro acesso.
          </p>
        </div>
      </section>
    </main>
  );
}
