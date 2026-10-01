"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { initialAccountDeletionActionState } from "@/app/settings/account-deletion-state";
import { deleteAccountAction } from "@/app/settings/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/account/account-deletion-contract";

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full sm:w-auto" disabled={pending} size="lg" type="submit" variant="destructive">
      {pending ? "Excluindo conta..." : "Excluir minha conta definitivamente"}
    </Button>
  );
}

export function AccountDeletionForm() {
  const [state, formAction] = useActionState(deleteAccountAction, initialAccountDeletionActionState);
  const passwordError = state.fieldErrors?.currentPassword?.[0];
  const confirmationError = state.fieldErrors?.confirmation?.[0];

  return (
    <form action={formAction} className="max-w-xl" noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(passwordError)}>
          <FieldLabel htmlFor="currentPassword">Senha atual</FieldLabel>
          <Input
            aria-invalid={Boolean(passwordError)}
            autoComplete="current-password"
            id="currentPassword"
            name="currentPassword"
            type="password"
          />
          <FieldError>{passwordError}</FieldError>
        </Field>

        <Field data-invalid={Boolean(confirmationError)}>
          <FieldLabel htmlFor="confirmation">Confirmação textual</FieldLabel>
          <Input
            aria-invalid={Boolean(confirmationError)}
            autoComplete="off"
            id="confirmation"
            name="confirmation"
            spellCheck={false}
            type="text"
          />
          <FieldDescription>
            Digite <strong>{ACCOUNT_DELETION_CONFIRMATION}</strong> exatamente como exibido.
          </FieldDescription>
          <FieldError>{confirmationError}</FieldError>
        </Field>

        {state.message ? (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível excluir a conta</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <DeleteButton />
      </FieldGroup>
    </form>
  );
}
