import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getRequestMetadata } from "@/lib/auth/request-metadata";

export const AUTH_AUDIT_ACTIONS = {
  userRegistered: "USER_REGISTERED",
  userLogin: "USER_LOGIN",
  userLogout: "USER_LOGOUT",
  loginFailed: "LOGIN_FAILED",
} as const;

type AuthAuditAction = (typeof AUTH_AUDIT_ACTIONS)[keyof typeof AUTH_AUDIT_ACTIONS];

type AuthAuditInput = {
  action: AuthAuditAction;
  userId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function recordAuthAuditLog({ action, userId = null, metadata }: AuthAuditInput) {
  const requestMetadata = await getRequestMetadata();

  await prisma.auditLog.create({
    data: {
      action,
      userId,
      entityType: "AUTH",
      metadata,
      ipHash: requestMetadata.ipHash,
      userAgentHash: requestMetadata.userAgentHash,
    },
  });
}
