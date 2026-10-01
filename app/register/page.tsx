import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, UserPlus } from "lucide-react";

import { RegisterForm } from "@/app/register/register-form";
import { BrandMark } from "@/components/layout/brand-mark";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(32rem,0.8fr)]">
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="flex w-full max-w-md flex-col gap-8">
          <BrandMark />

          <Card>
            <CardHeader>
              <span className="mb-2 grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                <UserPlus aria-hidden="true" className="size-5" />
              </span>
              <CardTitle className="text-2xl">Criar conta</CardTitle>
              <CardDescription>Comece com dados financeiros isolados por usuário.</CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterForm />
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Já tem conta?{" "}
                <Link className="font-semibold text-primary hover:underline" href="/login">Entrar</Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:items-end">
        <div className="max-w-xl">
          <ShieldCheck aria-hidden="true" className="mb-6 size-8 text-sidebar-primary" />
          <p className="text-sm font-semibold text-sidebar-primary">Privacidade no desenho</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Cada dado financeiro no seu lugar.</h2>
          <p className="mt-4 max-w-lg leading-7 text-sidebar-foreground/70">
            Usuários, contas, importações, transações, categorias, sessões e auditoria separados desde o início.
          </p>
        </div>
      </section>
    </main>
  );
}
