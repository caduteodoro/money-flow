"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction } from "@/app/register/actions";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Criando conta..." : "Criar conta"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, { message: null });

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Nome</span>
        <input
          autoComplete="name"
          className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-teal-100"
          name="name"
          placeholder="Seu nome"
          type="text"
        />
        {state.fieldErrors?.name ? (
          <span className="mt-2 block text-sm text-rose-700">{state.fieldErrors.name[0]}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">E-mail</span>
        <input
          autoComplete="email"
          className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-teal-100"
          name="email"
          placeholder="voce@exemplo.com"
          type="email"
        />
        {state.fieldErrors?.email ? (
          <span className="mt-2 block text-sm text-rose-700">{state.fieldErrors.email[0]}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Senha</span>
        <input
          autoComplete="new-password"
          className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-teal-100"
          name="password"
          placeholder="Minimo de 8 caracteres"
          type="password"
        />
        {state.fieldErrors?.password ? (
          <span className="mt-2 block text-sm text-rose-700">{state.fieldErrors.password[0]}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Confirmar senha</span>
        <input
          autoComplete="new-password"
          className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-teal-100"
          name="confirmPassword"
          placeholder="Repita sua senha"
          type="password"
        />
        {state.fieldErrors?.confirmPassword ? (
          <span className="mt-2 block text-sm text-rose-700">
            {state.fieldErrors.confirmPassword[0]}
          </span>
        ) : null}
      </label>

      {state.message ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.message}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
