"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction } from "@/app/login/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} size="lg" type="submit">
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, { message: null });
  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <form action={formAction} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(emailError)}>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            aria-invalid={Boolean(emailError)}
            autoComplete="email"
            id="email"
            name="email"
            placeholder="voce@exemplo.com"
            type="email"
          />
          <FieldError>{emailError}</FieldError>
        </Field>

        <Field data-invalid={Boolean(passwordError)}>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <Input
            aria-invalid={Boolean(passwordError)}
            autoComplete="current-password"
            id="password"
            name="password"
            placeholder="Sua senha"
            type="password"
          />
          <FieldError>{passwordError}</FieldError>
        </Field>

        {state.message ? (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível entrar</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <SubmitButton />
      </FieldGroup>
    </form>
  );
}
