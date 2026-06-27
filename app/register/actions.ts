"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AUTH_AUDIT_ACTIONS, recordAuthAuditLog } from "@/lib/auth/audit";
import { hashPassword } from "@/lib/auth/password";
import { createUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

type RegisterActionState = {
  message: string | null;
  fieldErrors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Informe seu nome."),
    email: z.string().trim().toLowerCase().email("Informe um e-mail valido."),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "A confirmacao precisa ser igual a senha.",
  });

export async function registerAction(
  _previousState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      message: "Revise os campos para criar sua conta.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
      },
    });

    await recordAuthAuditLog({
      action: AUTH_AUDIT_ACTIONS.userRegistered,
      userId: user.id,
    });
    await createUserSession(user.id);

    redirect("/dashboard");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        message: "Nao foi possivel criar uma conta com este e-mail.",
        fieldErrors: {
          email: ["Este e-mail ja esta em uso."],
        },
      };
    }

    throw error;
  }
}
