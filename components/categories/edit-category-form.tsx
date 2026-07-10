"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Save } from "lucide-react";

import {
  initialCategoryActionState,
  updateCategoryAction,
} from "@/app/categories/actions";
import { CategoryActionMessage } from "@/components/categories/action-message";
import { Button } from "@/components/ui/button";

export function EditCategoryForm({ categoryId, currentName }: { categoryId: string; currentName: string }) {
  const [state, action] = useActionState(updateCategoryAction, initialCategoryActionState);

  return (
    <form action={action} className="space-y-3 rounded-lg bg-slate-50 p-4" noValidate>
      <input name="categoryId" type="hidden" value={categoryId} />
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Novo nome</span>
        <input
          className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-teal-100"
          defaultValue={currentName}
          maxLength={60}
          name="name"
          required
          type="text"
        />
        {state.fieldErrors?.name ? <span className="mt-2 block text-sm text-rose-700">{state.fieldErrors.name[0]}</span> : null}
      </label>
      <CategoryActionMessage state={state} />
      <EditSubmitButton />
    </form>
  );
}

function EditSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" variant="secondary">
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
      {pending ? "Salvando..." : "Salvar nome"}
    </Button>
  );
}
