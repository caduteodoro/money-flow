"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { deleteAccountAction } from "@/app/settings/actions";
import { initialAccountDeletionActionState } from "@/app/settings/account-deletion-state";
import { Button } from "@/components/ui/button";
import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/account/account-deletion-contract";

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full sm:w-auto" disabled={pending} type="submit" variant="destructive">
      {pending ? "Excluindo conta..." : "Excluir minha conta definitivamente"}
    </Button>
  );
}

export function AccountDeletionForm() {
  const [state, formAction] = useActionState(deleteAccountAction, initialAccountDeletionActionState);

  return (
    <form action={formAction} className="mt-6 space-y-5" noValidate>
      <label className="block max-w-xl">
        <span className="text-sm font-semibold text-slate-800">Senha atual</span>
        <input
          autoComplete="current-password"
          className="mt-2 h-11 w-full rounded-md border border-rose-200 px-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          name="currentPassword"
          type="password"
        />
        {state.fieldErrors?.currentPassword ? <span className="mt-2 block text-sm text-rose-700">{state.fieldErrors.currentPassword[0]}</span> : null}
      </label>

      <label className="block max-w-xl">
        <span className="text-sm font-semibold text-slate-800">
          Digite <strong>{ACCOUNT_DELETION_CONFIRMATION}</strong>
        </span>
        <input
          autoComplete="off"
          className="mt-2 h-11 w-full rounded-md border border-rose-200 px-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          name="confirmation"
          spellCheck={false}
          type="text"
        />
        {state.fieldErrors?.confirmation ? <span className="mt-2 block text-sm text-rose-700">{state.fieldErrors.confirmation[0]}</span> : null}
      </label>

      {state.message ? <p className="max-w-xl rounded-md bg-rose-100 px-3 py-2 text-sm text-rose-800" role="alert">{state.message}</p> : null}
      <DeleteButton />
    </form>
  );
}
