import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole, Route } from "lucide-react";

import { LoginForm } from "@/app/login/login-form";
import { BrandMark } from "@/components/layout/brand-mark";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(32rem,0.8fr)]">
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="flex w-full max-w-md flex-col gap-8">
          <BrandMark />

          <Card>
            <CardHeader>
              <span className="mb-2 grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                <LockKeyhole aria-hidden="true" className="size-5" />
              </span>
              <CardTitle className="text-2xl">Entrar</CardTitle>
              <CardDescription>Acesse sua rota financeira com uma sessão segura.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {showRegistrationNotice ? (
                <Alert>
                  <AlertTitle>Cadastro recebido</AlertTitle>
                  <AlertDescription>Se os dados foram cadastrados, você já pode entrar com suas credenciais.</AlertDescription>
                </Alert>
              ) : null}
              <LoginForm />
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Ainda não tem conta?{" "}
                <Link className="font-semibold text-primary hover:underline" href="/register">Criar conta</Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:items-end">
        <div className="max-w-xl">
          <Route aria-hidden="true" className="mb-6 size-8 text-sidebar-primary" />
          <p className="text-sm font-semibold text-sidebar-primary">Privacidade desde a origem</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Sua visão financeira, sem perder isolamento.</h2>
          <p className="mt-4 max-w-lg leading-7 text-sidebar-foreground/70">
            Sessões protegidas, consultas filtradas por usuário e dados financeiros tratados como informação privada.
          </p>
        </div>
      </section>
    </main>
  );
}
