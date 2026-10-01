"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus } from "lucide-react";

import { createChildCategoryAction } from "@/app/categories/actions";
import { initialCategoryActionState } from "@/app/categories/category-action-state";
import { CategoryActionMessage } from "@/components/categories/action-message";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function CreateChildCategoryForm({ parentCategoryId }: { parentCategoryId: string }) {
  const [state, action] = useActionState(createChildCategoryAction, initialCategoryActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form ref={formRef} action={action} className="space-y-3" noValidate>
      <input name="parentCategoryId" type="hidden" value={parentCategoryId} />
      <Field data-invalid={Boolean(state.fieldErrors?.name)}>
        <FieldLabel htmlFor={`child-name-${parentCategoryId}`}>Nome da subcategoria</FieldLabel>
        <Input id={`child-name-${parentCategoryId}`} maxLength={60} name="name" placeholder="Ex.: Mercado" required type="text" />
        <FieldError errors={state.fieldErrors?.name?.map((message) => ({ message }))} />
      </Field>
      <CategoryActionMessage state={state} />
      <ChildSubmitButton />
    </form>
  );
}

function ChildSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" variant="secondary">
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
      {pending ? "Criando..." : "Adicionar subcategoria"}
    </Button>
  );
}
