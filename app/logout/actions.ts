"use server";

import { redirect } from "next/navigation";
import { AUTH_AUDIT_ACTIONS, recordAuthAuditLog } from "@/lib/auth/audit";
import { invalidateCurrentSession } from "@/lib/auth/session";

export async function logoutAction() {
  const session = await invalidateCurrentSession();

  if (session) {
    await recordAuthAuditLog({
      action: AUTH_AUDIT_ACTIONS.userLogout,
      userId: session.userId,
    });
  }

  redirect("/login");
}
