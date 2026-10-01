"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus } from "lucide-react";

import { createCategoryAction } from "@/app/categories/actions";
import { initialCategoryActionState } from "@/app/categories/category-action-state";
import { CategoryActionMessage } from "@/components/categories/action-message";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function CreateCategoryForm() {
  const [state, action] = useActionState(createCategoryAction, initialCategoryActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form ref={formRef} action={action} className="space-y-3" noValidate>
      <Field className="max-w-xl" data-invalid={Boolean(state.fieldErrors?.name)}>
        <FieldLabel htmlFor="category-name">Nome da categoria</FieldLabel>
        <Input id="category-name" maxLength={60} name="name" placeholder="Ex.: Alimentação" required type="text" />
        <FieldError errors={state.fieldErrors?.name?.map((message) => ({ message }))} />
      </Field>
      <CategoryActionMessage state={state} />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
      {pending ? "Criando..." : "Criar categoria"}
    </Button>
  );
}
