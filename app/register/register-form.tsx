"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { registerAction } from "@/app/register/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} size="lg" type="submit">
      {pending ? "Criando conta..." : "Criar conta"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, { message: null });

  return (
    <form action={formAction} noValidate>
      <FieldGroup>
        <RegisterField
          autoComplete="name"
          error={state.fieldErrors?.name?.[0]}
          label="Nome"
          name="name"
          placeholder="Seu nome"
          type="text"
        />
        <RegisterField
          autoComplete="email"
          error={state.fieldErrors?.email?.[0]}
          label="E-mail"
          name="email"
          placeholder="voce@exemplo.com"
          type="email"
        />
        <RegisterField
          autoComplete="new-password"
          error={state.fieldErrors?.password?.[0]}
          label="Senha"
          name="password"
          placeholder="Mínimo de 8 caracteres"
          type="password"
        />
        <RegisterField
          autoComplete="new-password"
          error={state.fieldErrors?.confirmPassword?.[0]}
          label="Confirmar senha"
          name="confirmPassword"
          placeholder="Repita sua senha"
          type="password"
        />

        {state.message ? (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível criar a conta</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <SubmitButton />
      </FieldGroup>
    </form>
  );
}

function RegisterField({
  autoComplete,
  error,
  label,
  name,
  placeholder,
  type,
}: {
  autoComplete: string;
  error?: string;
  label: string;
  name: string;
  placeholder: string;
  type: string;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        id={name}
        name={name}
        placeholder={placeholder}
        type={type}
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
}
