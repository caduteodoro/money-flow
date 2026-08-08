import "server-only";

import type { Prisma } from "@prisma/client";

import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/account/account-deletion-contract";
import { verifyPassword } from "@/lib/auth/password";
import { hashSensitiveValue } from "@/lib/auth/request-metadata";
import { prisma } from "@/lib/db/prisma";
import { createRateLimitPolicyKeys } from "@/lib/security/rate-limit/identity-rate-limit";
import { LOGIN_RATE_LIMIT_POLICIES } from "@/lib/security/rate-limit/login-rate-limit";
import { REGISTER_RATE_LIMIT_POLICIES } from "@/lib/security/rate-limit/register-rate-limit";

export type AccountDeletionStep =
  | "transactions"
  | "categoryRules"
  | "categoryHierarchy"
  | "categories"
  | "statementImports"
  | "bankAccounts"
  | "sessions"
  | "auditLogs"
  | "rateLimitBuckets"
  | "user";

type DeleteAccountInput = {
  userId: string;
  currentPassword: string;
  confirmation: string;
  testOnlyFailAfterStep?: AccountDeletionStep;
};

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; reason: "invalid_credentials" | "invalid_confirmation" };

function notifyTestFailure(step: AccountDeletionStep, requested?: AccountDeletionStep) {
  if (!requested || requested !== step) return;
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Account deletion failure injection is restricted to tests.");
  }
  throw new Error(`Synthetic account deletion failure after ${step}.`);
}

export async function deleteAccount(input: DeleteAccountInput): Promise<DeleteAccountResult> {
  if (input.confirmation !== ACCOUNT_DELETION_CONFIRMATION) {
    return { ok: false, reason: "invalid_confirmation" };
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, passwordHash: true },
  });
  const passwordMatches = user
    ? await verifyPassword(input.currentPassword, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    return { ok: false, reason: "invalid_credentials" };
  }

  const normalizedEmail = user.email.trim().toLowerCase();
  const rateLimitKeys = [
    ...createRateLimitPolicyKeys(normalizedEmail, LOGIN_RATE_LIMIT_POLICIES),
    ...createRateLimitPolicyKeys(normalizedEmail, REGISTER_RATE_LIMIT_POLICIES),
  ];
  const emailHash = hashSensitiveValue(normalizedEmail);

  await prisma.$transaction(async (tx) => {
    await deleteOwnedData(tx, user.id, emailHash, rateLimitKeys, input.testOnlyFailAfterStep);
  });

  return { ok: true };
}

async function deleteOwnedData(
  tx: Prisma.TransactionClient,
  userId: string,
  emailHash: string,
  rateLimitKeys: Array<{ scope: string; keyDigest: string }>,
  failAfter?: AccountDeletionStep,
) {
  await tx.transaction.deleteMany({ where: { userId } });
  notifyTestFailure("transactions", failAfter);

  await tx.categoryRule.deleteMany({ where: { userId } });
  notifyTestFailure("categoryRules", failAfter);

  await tx.category.updateMany({ where: { userId, parentId: { not: null } }, data: { parentId: null } });
  notifyTestFailure("categoryHierarchy", failAfter);

  await tx.category.deleteMany({ where: { userId } });
  notifyTestFailure("categories", failAfter);

  await tx.statementImport.deleteMany({ where: { userId } });
  notifyTestFailure("statementImports", failAfter);

  await tx.bankAccount.deleteMany({ where: { userId } });
  notifyTestFailure("bankAccounts", failAfter);

  await tx.session.deleteMany({ where: { userId } });
  notifyTestFailure("sessions", failAfter);

  await tx.auditLog.deleteMany({
    where: {
      OR: [
        { userId },
        { entityType: "User", entityId: userId },
        { metadata: { path: ["emailHash"], equals: emailHash } },
      ],
    },
  });
  notifyTestFailure("auditLogs", failAfter);

  await tx.rateLimitBucket.deleteMany({
    where: { OR: rateLimitKeys.map(({ scope, keyDigest }) => ({ scope, keyDigest })) },
  });
  notifyTestFailure("rateLimitBuckets", failAfter);

  const deletedUser = await tx.user.deleteMany({ where: { id: userId } });
  if (deletedUser.count !== 1) throw new Error("Authenticated account was not deleted.");
  notifyTestFailure("user", failAfter);
}
