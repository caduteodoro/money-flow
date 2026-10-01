"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Save } from "lucide-react";

import { updateCategoryAction } from "@/app/categories/actions";
import { initialCategoryActionState } from "@/app/categories/category-action-state";
import { CategoryActionMessage } from "@/components/categories/action-message";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function EditCategoryForm({ categoryId, currentName }: { categoryId: string; currentName: string }) {
  const [state, action] = useActionState(updateCategoryAction, initialCategoryActionState);

  return (
    <form action={action} className="space-y-3" noValidate>
      <input name="categoryId" type="hidden" value={categoryId} />
      <Field data-invalid={Boolean(state.fieldErrors?.name)}>
        <FieldLabel htmlFor={`edit-name-${categoryId}`}>Novo nome</FieldLabel>
        <Input id={`edit-name-${categoryId}`} defaultValue={currentName} maxLength={60} name="name" required type="text" />
        <FieldError errors={state.fieldErrors?.name?.map((message) => ({ message }))} />
      </Field>
      <CategoryActionMessage state={state} />
      <EditSubmitButton />
    </form>
  );
}

function EditSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" variant="secondary">
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
      {pending ? "Salvando..." : "Salvar nome"}
    </Button>
  );
}
