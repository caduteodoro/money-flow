"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import type { AccountDeletionActionState } from "@/app/settings/account-deletion-state";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/account/account-deletion-contract";
import { deleteAccount } from "@/lib/account/account-deletion-service";

const accountDeletionSchema = z.object({
  currentPassword: z.string().min(1, "Informe sua senha atual."),
  confirmation: z.literal(ACCOUNT_DELETION_CONFIRMATION, {
    error: `Digite exatamente ${ACCOUNT_DELETION_CONFIRMATION}.`,
  }),
});

const genericFailureMessage = "Nao foi possivel excluir sua conta. Nenhum dado foi alterado.";

export async function deleteAccountAction(
  _previousState: AccountDeletionActionState,
  formData: FormData,
): Promise<AccountDeletionActionState> {
  const user = await requireCurrentUser();
  const parsed = accountDeletionSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise as confirmacoes para continuar.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await deleteAccount({ userId: user.id, ...parsed.data });
    if (!result.ok) {
      return {
        status: "error",
        message: result.reason === "invalid_credentials"
          ? "A senha atual esta incorreta."
          : "Revise as confirmacoes para continuar.",
      };
    }
  } catch {
    return { status: "error", message: genericFailureMessage };
  }

  await clearSessionCookie();
  redirect("/account-deleted");
}
