"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { AUTH_AUDIT_ACTIONS, recordAuthAuditLog } from "@/lib/auth/audit";
import { verifyPassword } from "@/lib/auth/password";
import { hashSensitiveValue } from "@/lib/auth/request-metadata";
import { createUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { applyLoginRateLimit, resetLoginRateLimit } from "@/lib/security/rate-limit/login-rate-limit";

type LoginActionState = {
  message: string | null;
  retryAfterSeconds?: number;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

const invalidCredentialsMessage = "Nao foi possivel entrar com essas credenciais.";
const rateLimitMessage = "Muitas tentativas. Aguarde antes de tentar novamente.";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe sua senha."),
});

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      message: "Revise os campos para continuar.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;
  const rateLimit = await applyLoginRateLimit(email);
  if (!rateLimit.allowed) {
    return {
      message: rateLimitMessage,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  const passwordMatches = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    await recordAuthAuditLog({
      action: AUTH_AUDIT_ACTIONS.loginFailed,
      metadata: {
        emailHash: hashSensitiveValue(email),
        reason: "INVALID_CREDENTIALS",
      },
    });

    return {
      message: invalidCredentialsMessage,
    };
  }

  await resetLoginRateLimit(email);
  await createUserSession(user.id);
  await recordAuthAuditLog({
    action: AUTH_AUDIT_ACTIONS.userLogin,
    userId: user.id,
  });

  redirect("/dashboard");
}
