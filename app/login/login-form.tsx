"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/app/login/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, { message: null });

  return (
    <form action={formAction} className="space-y-4" noValidate>
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
          autoComplete="current-password"
          className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-teal-100"
          name="password"
          placeholder="********"
          type="password"
        />
        {state.fieldErrors?.password ? (
          <span className="mt-2 block text-sm text-rose-700">{state.fieldErrors.password[0]}</span>
        ) : null}
      </label>

      {state.message ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.message}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
