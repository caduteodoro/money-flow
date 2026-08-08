import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/account/account-deletion-contract";
import { deleteAccount } from "@/lib/account/account-deletion-service";
import { hashPassword } from "@/lib/auth/password";
import { hashSensitiveValue } from "@/lib/auth/request-metadata";
import { hashSessionToken, validateSessionToken } from "@/lib/auth/session";
import { categoryNameFields } from "../helpers/category-fixture";
import { createRateLimitPolicyKeys } from "@/lib/security/rate-limit/identity-rate-limit";
import { LOGIN_RATE_LIMIT_POLICIES } from "@/lib/security/rate-limit/login-rate-limit";
import { REGISTER_RATE_LIMIT_POLICIES } from "@/lib/security/rate-limit/register-rate-limit";
import { assertTestDatabaseEnvironment } from "../helpers/assert-test-database.mjs";

const prisma = new PrismaClient();
const secret = "synthetic-account-deletion-secret-with-more-than-32-bytes";
const password = "synthetic-account-deletion-password";
const users = {
  a: { id: "account-deletion-user-a", email: "account-deletion-a@example.test" },
  b: { id: "account-deletion-user-b", email: "account-deletion-b@example.test" },
};
const sessionTokens = { a: "synthetic-account-deletion-token-a", b: "synthetic-account-deletion-token-b" };

function rateKeys(email: string) {
  return [
    ...createRateLimitPolicyKeys(email, LOGIN_RATE_LIMIT_POLICIES, secret),
    ...createRateLimitPolicyKeys(email, REGISTER_RATE_LIMIT_POLICIES, secret),
  ];
}

async function cleanup() {
  const ids = Object.values(users).map(({ id }) => id);
  const emails = Object.values(users).map(({ email }) => email);
  await prisma.rateLimitBucket.deleteMany({ where: { OR: emails.flatMap(rateKeys) } });
  await prisma.auditLog.deleteMany({ where: { OR: [
    { userId: { in: ids } },
    ...emails.map((email) => ({ metadata: { path: ["emailHash"], equals: hashSensitiveValue(email) } })),
  ] } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

async function seedUser(key: "a" | "b") {
  const user = users[key];
  const prefix = `account-deletion-${key}`;
  await prisma.user.create({ data: { id: user.id, name: `Synthetic User ${key.toUpperCase()}`, email: user.email, passwordHash: await hashPassword(password) } });
  await prisma.session.createMany({ data: [1, 2].map((number) => ({ id: `${prefix}-session-${number}`, userId: user.id, tokenHash: hashSessionToken(`${sessionTokens[key]}-${number}`), expiresAt: new Date("2027-01-01T00:00:00.000Z"), userAgent: `synthetic-agent-${key}`, ipHash: hashSensitiveValue(`192.0.2.${key === "a" ? 10 : 20}`) })) });
  await prisma.bankAccount.create({ data: { id: `${prefix}-bank`, userId: user.id, name: `Synthetic Bank ${key}` } });
  await prisma.statementImport.create({ data: { id: `${prefix}-import`, userId: user.id, bankAccountId: `${prefix}-bank`, format: "CSV", status: "COMPLETED", originalFileName: `synthetic-${key}.csv`, fileHash: hashSensitiveValue(`synthetic-file-${key}`), rowCount: 1, importedCount: 1 } });
  await prisma.category.create({ data: { id: `${prefix}-root`, userId: user.id, ...categoryNameFields(`Synthetic Root ${key}`) } });
  await prisma.category.create({ data: { id: `${prefix}-child`, userId: user.id, parentId: `${prefix}-root`, ...categoryNameFields(`Synthetic Child ${key}`) } });
  await prisma.categoryRule.create({ data: { id: `${prefix}-rule`, userId: user.id, categoryId: `${prefix}-child`, name: `Synthetic Rule ${key}`, matchText: `synthetic-match-${key}` } });
  await prisma.transaction.create({ data: { id: `${prefix}-transaction`, userId: user.id, bankAccountId: `${prefix}-bank`, statementImportId: `${prefix}-import`, categoryId: `${prefix}-child`, occurredAt: new Date("2026-08-08T12:00:00.000Z"), description: `Synthetic description ${key}`, normalizedDescription: `synthetic description ${key}`, descriptionHash: hashSensitiveValue(`synthetic-description-${key}`), amountCents: key === "a" ? 1234 : 5678, direction: "EXPENSE", dedupeKey: `${prefix}-dedupe`, rawPayload: { synthetic: true, owner: key } } });
  await prisma.auditLog.createMany({ data: [
    { id: `${prefix}-audit-linked`, userId: user.id, action: "USER_LOGIN", entityType: "AUTH", ipHash: hashSensitiveValue(`192.0.2.${key === "a" ? 10 : 20}`), userAgentHash: hashSensitiveValue(`synthetic-agent-${key}`) },
    { id: `${prefix}-audit-email`, action: "LOGIN_FAILED", entityType: "AUTH", metadata: { emailHash: hashSensitiveValue(user.email), reason: "INVALID_CREDENTIALS" } },
  ] });
  await prisma.rateLimitBucket.createMany({ data: rateKeys(user.email).map(({ scope, keyDigest }, index) => ({ scope, keyDigest, windowStart: new Date(`2026-08-08T1${index}:00:00.000Z`), expiresAt: new Date("2026-08-09T00:00:00.000Z"), count: index + 1 })) });
}

async function snapshot(userId: string, email: string) {
  const keys = rateKeys(email);
  return {
    user: await prisma.user.findMany({ where: { id: userId } }),
    sessions: await prisma.session.findMany({ where: { userId }, orderBy: { id: "asc" } }),
    bankAccounts: await prisma.bankAccount.findMany({ where: { userId }, orderBy: { id: "asc" } }),
    imports: await prisma.statementImport.findMany({ where: { userId }, orderBy: { id: "asc" } }),
    transactions: await prisma.transaction.findMany({ where: { userId }, orderBy: { id: "asc" } }),
    categories: await prisma.category.findMany({ where: { userId }, orderBy: { id: "asc" } }),
    rules: await prisma.categoryRule.findMany({ where: { userId }, orderBy: { id: "asc" } }),
    auditLogs: await prisma.auditLog.findMany({ where: { OR: [{ userId }, { metadata: { path: ["emailHash"], equals: hashSensitiveValue(email) } }] }, orderBy: { id: "asc" } }),
    buckets: await prisma.rateLimitBucket.findMany({ where: { OR: keys }, orderBy: [{ scope: "asc" }, { windowStart: "asc" }] }),
  };
}

beforeAll(() => {
  assertTestDatabaseEnvironment(process.env);
  process.env.RATE_LIMIT_HMAC_SECRET = secret;
});

beforeEach(async () => {
  await cleanup();
  await seedUser("a");
  await seedUser("b");
});

afterAll(async () => {
  try { await cleanup(); } finally { await prisma.$disconnect(); }
});

describe("atomic account deletion with real PostgreSQL", () => {
  it("rejects incorrect credentials without changing either user", async () => {
    const beforeA = await snapshot(users.a.id, users.a.email);
    const beforeB = await snapshot(users.b.id, users.b.email);
    await expect(deleteAccount({ userId: users.a.id, currentPassword: "wrong-password", confirmation: ACCOUNT_DELETION_CONFIRMATION })).resolves.toEqual({ ok: false, reason: "invalid_credentials" });
    expect(await snapshot(users.a.id, users.a.email)).toEqual(beforeA);
    expect(await snapshot(users.b.id, users.b.email)).toEqual(beforeB);
  });

  it("removes every owned or identity-derived record and preserves user B exactly", async () => {
    const beforeB = await snapshot(users.b.id, users.b.email);
    await expect(deleteAccount({ userId: users.a.id, currentPassword: password, confirmation: ACCOUNT_DELETION_CONFIRMATION })).resolves.toEqual({ ok: true });
    expect(await snapshot(users.a.id, users.a.email)).toEqual({ user: [], sessions: [], bankAccounts: [], imports: [], transactions: [], categories: [], rules: [], auditLogs: [], buckets: [] });
    expect(await snapshot(users.b.id, users.b.email)).toEqual(beforeB);
    await expect(validateSessionToken(`${sessionTokens.a}-1`)).resolves.toBeNull();
    await expect(validateSessionToken(`${sessionTokens.b}-1`)).resolves.not.toBeNull();
  });

  it("rolls back a mid-operation failure without changing either user", async () => {
    const beforeA = await snapshot(users.a.id, users.a.email);
    const beforeB = await snapshot(users.b.id, users.b.email);
    await expect(deleteAccount({ userId: users.a.id, currentPassword: password, confirmation: ACCOUNT_DELETION_CONFIRMATION, testOnlyFailAfterStep: "sessions" })).rejects.toThrow("Synthetic account deletion failure after sessions.");
    expect(await snapshot(users.a.id, users.a.email)).toEqual(beforeA);
    expect(await snapshot(users.b.id, users.b.email)).toEqual(beforeB);
    await expect(validateSessionToken(`${sessionTokens.a}-1`)).resolves.not.toBeNull();
  });
});
