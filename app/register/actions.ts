"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AUTH_AUDIT_ACTIONS, recordAuthAuditLog } from "@/lib/auth/audit";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { applyRegisterRateLimit } from "@/lib/security/rate-limit/register-rate-limit";

type RegisterActionState = {
  message: string | null;
  retryAfterSeconds?: number;
  fieldErrors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

const rateLimitMessage = "Muitas tentativas de cadastro. Aguarde antes de tentar novamente.";
const neutralRegistrationDestination = "/login?registration=submitted";

function isUserEmailUniqueConstraintError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;

  return Array.isArray(target) && target.length === 1 && target[0] === "email";
}

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
  const rateLimit = await applyRegisterRateLimit(email);
  if (!rateLimit.allowed) {
    return {
      message: rateLimitMessage,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    };
  }

  const passwordHash = await hashPassword(password);

  let createdUserId: string | null = null;

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

    createdUserId = user.id;
  } catch (error) {
    if (!isUserEmailUniqueConstraintError(error)) {
      throw error;
    }
  }

  if (createdUserId) {
    await recordAuthAuditLog({
      action: AUTH_AUDIT_ACTIONS.userRegistered,
      userId: createdUserId,
    });
  }

  redirect(neutralRegistrationDestination);
}
