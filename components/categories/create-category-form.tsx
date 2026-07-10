"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus } from "lucide-react";

import {
  createCategoryAction,
  initialCategoryActionState,
} from "@/app/categories/actions";
import { CategoryActionMessage } from "@/components/categories/action-message";
import { Button } from "@/components/ui/button";

export function CreateCategoryForm() {
  const [state, action] = useActionState(createCategoryAction, initialCategoryActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={action} className="space-y-3" noValidate>
      <label className="block max-w-xl">
        <span className="text-sm font-medium text-slate-700">Nome da categoria</span>
        <input
          className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-teal-100"
          maxLength={60}
          name="name"
          placeholder="Ex.: Alimentacao"
          required
          type="text"
        />
        {state.fieldErrors?.name ? (
          <span className="mt-2 block text-sm text-rose-700">{state.fieldErrors.name[0]}</span>
        ) : null}
      </label>
      <CategoryActionMessage state={state} />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
      {pending ? "Criando..." : "Criar categoria"}
    </Button>
  );
}
