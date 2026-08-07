import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => ({ cookieSet: vi.fn(), redirectTargets: [] as string[] }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: runtime.cookieSet }),
  headers: async () => ({ get: () => null }),
}));
vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    runtime.redirectTargets.push(target);
    throw new Error("synthetic redirect");
  },
}));

import { loginAction } from "@/app/login/actions";
import { registerAction } from "@/app/register/actions";
import { hashPassword } from "@/lib/auth/password";
import { applyLoginRateLimit, LOGIN_RATE_LIMIT_POLICIES } from "@/lib/security/rate-limit/login-rate-limit";
import { createRateLimitKeyDigest } from "@/lib/security/rate-limit/rate-limit-key";
import { applyRegisterRateLimit, REGISTER_RATE_LIMIT_POLICIES } from "@/lib/security/rate-limit/register-rate-limit";
import type { IdentityRateLimitPolicy } from "@/lib/security/rate-limit/identity-rate-limit";
import { assertTestDatabaseEnvironment } from "../helpers/assert-test-database.mjs";

const prisma = new PrismaClient();
const secret = "synthetic-register-integration-secret-32-bytes-minimum";
const password = "synthetic-password-4.1";
const fixtureEmails = {
  short: "register-rate-limit-short@example.test",
  long: "register-rate-limit-long@example.test",
  neutralExisting: "register-rate-limit-neutral-existing@example.test",
  neutralMissing: "register-rate-limit-neutral-missing@example.test",
  neutralNew: "register-rate-limit-neutral-new@example.test",
  valid: "register-rate-limit-valid@example.test",
  concurrent: "register-rate-limit-concurrent@example.test",
  other: "register-rate-limit-other@example.test",
};
const existingUsers = [
  { id: "integration-register-rate-limit-short", email: fixtureEmails.short },
  { id: "integration-register-rate-limit-long", email: fixtureEmails.long },
  { id: "integration-register-rate-limit-neutral", email: fixtureEmails.neutralExisting },
];
const allEmails = Object.values(fixtureEmails);

function form(email: string) {
  const data = new FormData();
  data.set("name", "Synthetic Register User");
  data.set("email", email);
  data.set("password", password);
  data.set("confirmPassword", password);
  return data;
}

function bucketPairs(email: string, policies: readonly IdentityRateLimitPolicy[]) {
  return policies.map(({ scope }) => ({
    scope,
    keyDigest: createRateLimitKeyDigest({ scope, normalizedIdentifier: email, secret }),
  }));
}

const allBucketPairs = allEmails.flatMap((email) => [
  ...bucketPairs(email, REGISTER_RATE_LIMIT_POLICIES),
  ...bucketPairs(email, LOGIN_RATE_LIMIT_POLICIES),
]);

async function removeFixtures() {
  const users = await prisma.user.findMany({ where: { email: { in: allEmails } }, select: { id: true } });
  const userIds = users.map(({ id }) => id);
  await prisma.rateLimitBucket.deleteMany({ where: { OR: allBucketPairs } });
  await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

beforeAll(async () => {
  assertTestDatabaseEnvironment(process.env);
  process.env.RATE_LIMIT_HMAC_SECRET = secret;
  await removeFixtures();
  const passwordHash = await hashPassword(password);
  await prisma.user.createMany({
    data: existingUsers.map(({ id, email }) => ({ id, email, name: "Synthetic Existing User", passwordHash })),
  });
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-07T12:00:00.000Z"));
  runtime.cookieSet.mockClear();
  runtime.redirectTargets.length = 0;
});

afterAll(async () => {
  vi.useRealTimers();
  try {
    await removeFixtures();
  } finally {
    delete process.env.RATE_LIMIT_HMAC_SECRET;
    await prisma.$disconnect();
  }
});

describe("registration rate limiting with real PostgreSQL", () => {
  it("does not consume buckets for a structurally invalid form", async () => {
    const result = await registerAction({ message: null }, form("invalid-email"));
    expect(result).toMatchObject({ message: "Revise os campos para criar sua conta." });
    expect(await prisma.rateLimitBucket.count({ where: { OR: allBucketPairs } })).toBe(0);
  });

  it("normalizes identity, allows three attempts, blocks the fourth, and recovers after fifteen minutes", async () => {
    const variants = [`  ${fixtureEmails.short.toUpperCase()}  `, fixtureEmails.short, fixtureEmails.short];
    for (const email of variants) {
      await expect(registerAction({ message: null }, form(email))).rejects.toThrow("synthetic redirect");
    }
    const blocked = await registerAction({ message: null }, form(fixtureEmails.short));
    expect(blocked).toEqual({ message: "Muitas tentativas de cadastro. Aguarde antes de tentar novamente.", retryAfterSeconds: 900 });
    const persisted = await prisma.rateLimitBucket.findMany({ where: { OR: bucketPairs(fixtureEmails.short, REGISTER_RATE_LIMIT_POLICIES) } });
    expect(JSON.stringify([blocked, persisted])).not.toContain(fixtureEmails.short);
    expect(JSON.stringify([blocked, persisted])).not.toContain(secret);
    expect(Object.fromEntries(persisted.map(({ scope, count }) => [scope, count]))).toMatchObject({
      "register:identity:burst": 3,
      "register:identity:sustained": 4,
    });

    vi.setSystemTime(new Date("2026-08-07T12:15:00.000Z"));
    await expect(registerAction({ message: null }, form(fixtureEmails.short))).rejects.toThrow("synthetic redirect");
  });

  it("allows five distributed attempts, blocks the sixth sustained attempt, and recovers after one hour", async () => {
    const offsets = [0, 901_000, 1_801_000, 2_701_000, 2_702_000];
    for (const offset of offsets) {
      vi.setSystemTime(new Date(Date.parse("2026-08-07T12:00:00.000Z") + offset));
      await expect(registerAction({ message: null }, form(fixtureEmails.long))).rejects.toThrow("synthetic redirect");
    }
    vi.setSystemTime(new Date("2026-08-07T12:45:03.000Z"));
    await expect(registerAction({ message: null }, form(fixtureEmails.long))).resolves.toEqual({
      message: "Muitas tentativas de cadastro. Aguarde antes de tentar novamente.",
      retryAfterSeconds: 897,
    });
    vi.setSystemTime(new Date("2026-08-07T13:00:00.000Z"));
    await expect(registerAction({ message: null }, form(fixtureEmails.long))).rejects.toThrow("synthetic redirect");
  });

  it("returns the same blocked response for existing and missing identities", async () => {
    vi.setSystemTime(new Date("2026-08-07T14:00:00.000Z"));
    for (const email of [fixtureEmails.neutralExisting, fixtureEmails.neutralMissing]) {
      for (let attempt = 0; attempt < 4; attempt += 1) await applyRegisterRateLimit(email);
    }
    const existing = await registerAction({ message: null }, form(fixtureEmails.neutralExisting));
    const missing = await registerAction({ message: null }, form(fixtureEmails.neutralMissing));
    expect(existing).toEqual(missing);
    expect(existing).toEqual({ message: "Muitas tentativas de cadastro. Aguarde antes de tentar novamente.", retryAfterSeconds: 900 });
    expect(await prisma.user.count({ where: { email: fixtureEmails.neutralMissing } })).toBe(0);
  });

  it("gives new and existing emails the same allowed destination without session or cookie", async () => {
    vi.setSystemTime(new Date("2026-08-07T15:00:00.000Z"));
    const existingBefore = await prisma.user.findUniqueOrThrow({
      where: { email: fixtureEmails.neutralExisting },
    });

    await expect(registerAction({ message: null }, form(fixtureEmails.neutralNew))).rejects.toThrow("synthetic redirect");
    const newDestination = runtime.redirectTargets.at(-1);
    await expect(registerAction({ message: null }, form(fixtureEmails.neutralExisting))).rejects.toThrow("synthetic redirect");
    const existingDestination = runtime.redirectTargets.at(-1);

    expect(newDestination).toBe("/login?registration=submitted");
    expect(existingDestination).toBe(newDestination);
    expect(await prisma.user.findUniqueOrThrow({ where: { email: fixtureEmails.neutralExisting } })).toEqual(existingBefore);
    const newUser = await prisma.user.findUniqueOrThrow({ where: { email: fixtureEmails.neutralNew }, select: { id: true } });
    expect(await prisma.auditLog.count({ where: { userId: newUser.id, action: "USER_REGISTERED" } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { userId: existingBefore.id, action: "USER_REGISTERED" } })).toBe(0);
    expect(await prisma.session.count({ where: { userId: { in: [newUser.id, existingBefore.id] } } })).toBe(0);
    expect(runtime.cookieSet).not.toHaveBeenCalled();
  });

  it("creates at most one user under concurrent registration and keeps both responses neutral", async () => {
    vi.setSystemTime(new Date("2026-08-07T15:30:00.000Z"));

    const attempts = await Promise.allSettled([
      registerAction({ message: null }, form(fixtureEmails.concurrent)),
      registerAction({ message: null }, form(fixtureEmails.concurrent)),
    ]);

    expect(attempts).toHaveLength(2);
    expect(attempts.every((attempt) => attempt.status === "rejected")).toBe(true);
    expect(runtime.redirectTargets).toEqual(["/login?registration=submitted", "/login?registration=submitted"]);
    const users = await prisma.user.findMany({ where: { email: fixtureEmails.concurrent }, select: { id: true } });
    expect(users).toHaveLength(1);
    expect(await prisma.auditLog.count({ where: { userId: users[0]?.id, action: "USER_REGISTERED" } })).toBe(1);
    expect(await prisma.session.count({ where: { userId: users[0]?.id } })).toBe(0);
    expect(runtime.cookieSet).not.toHaveBeenCalled();
  });

  it("preserves registration buckets and creates a session only on the subsequent valid login", async () => {
    vi.setSystemTime(new Date("2026-08-07T16:00:00.000Z"));
    await applyLoginRateLimit(fixtureEmails.valid);
    await applyRegisterRateLimit(fixtureEmails.other);
    const loginBefore = await prisma.rateLimitBucket.findMany({
      where: { OR: bucketPairs(fixtureEmails.valid, LOGIN_RATE_LIMIT_POLICIES) },
      orderBy: { scope: "asc" },
    });
    const otherBefore = await prisma.rateLimitBucket.findMany({
      where: { OR: bucketPairs(fixtureEmails.other, REGISTER_RATE_LIMIT_POLICIES) },
      orderBy: { scope: "asc" },
    });

    await expect(registerAction({ message: null }, form(fixtureEmails.valid))).rejects.toThrow("synthetic redirect");
    expect(runtime.redirectTargets).toEqual(["/login?registration=submitted"]);
    const registrationBuckets = await prisma.rateLimitBucket.findMany({
      where: { OR: bucketPairs(fixtureEmails.valid, REGISTER_RATE_LIMIT_POLICIES) },
      orderBy: { scope: "asc" },
      select: { count: true },
    });
    expect(registrationBuckets).toEqual([{ count: 1 }, { count: 1 }]);
    await expect(prisma.rateLimitBucket.findMany({ where: { OR: bucketPairs(fixtureEmails.valid, LOGIN_RATE_LIMIT_POLICIES) }, orderBy: { scope: "asc" } })).resolves.toEqual(loginBefore);
    await expect(prisma.rateLimitBucket.findMany({ where: { OR: bucketPairs(fixtureEmails.other, REGISTER_RATE_LIMIT_POLICIES) }, orderBy: { scope: "asc" } })).resolves.toEqual(otherBefore);
    const validUser = await prisma.user.findUniqueOrThrow({ where: { email: fixtureEmails.valid }, select: { id: true } });
    expect(await prisma.session.count({ where: { userId: validUser.id } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { userId: validUser.id, action: "USER_REGISTERED" } })).toBe(1);
    expect(runtime.cookieSet).not.toHaveBeenCalled();

    runtime.redirectTargets.length = 0;
    await expect(loginAction({ message: null }, form(fixtureEmails.valid))).rejects.toThrow("synthetic redirect");
    expect(runtime.redirectTargets).toEqual(["/dashboard"]);
    expect(await prisma.session.count({ where: { userId: validUser.id } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { userId: validUser.id, action: "USER_LOGIN" } })).toBe(1);
    expect(runtime.cookieSet).toHaveBeenCalledOnce();
  });
});
