import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => ({ cookieSet: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: runtime.cookieSet }),
  headers: async () => ({ get: () => null }),
}));
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("synthetic redirect"); } }));

import { loginAction } from "@/app/login/actions";
import { hashPassword } from "@/lib/auth/password";
import { hashSensitiveValue } from "@/lib/auth/request-metadata";
import { applyLoginRateLimit, LOGIN_RATE_LIMIT_POLICIES } from "@/lib/security/rate-limit/login-rate-limit";
import { createRateLimitKeyDigest } from "@/lib/security/rate-limit/rate-limit-key";
import { applyRegisterRateLimit, REGISTER_RATE_LIMIT_POLICIES } from "@/lib/security/rate-limit/register-rate-limit";
import { assertTestDatabaseEnvironment } from "../helpers/assert-test-database.mjs";

const prisma = new PrismaClient();
const secret = "synthetic-login-integration-secret-32-bytes-minimum";
const userId = "integration-login-rate-limit-user";
const userEmail = "login-rate-limit-user@example.test";
const missingEmail = "login-rate-limit-missing@example.test";
const longEmail = "login-rate-limit-long@example.test";
const otherEmail = "login-rate-limit-other@example.test";
const password = "synthetic-password-3.3";
const identities = [userEmail, missingEmail, longEmail, otherEmail];

function form(email: string, suppliedPassword = "wrong-synthetic-password") {
  const data = new FormData();
  data.set("email", email);
  data.set("password", suppliedPassword);
  return data;
}

function bucketPairs(email: string) {
  return LOGIN_RATE_LIMIT_POLICIES.map(({ scope }) => ({
    scope,
    keyDigest: createRateLimitKeyDigest({ scope, normalizedIdentifier: email, secret }),
  }));
}

function registerBucketPairs(email: string) {
  return REGISTER_RATE_LIMIT_POLICIES.map(({ scope }) => ({
    scope,
    keyDigest: createRateLimitKeyDigest({ scope, normalizedIdentifier: email, secret }),
  }));
}

async function removeFixtures() {
  await prisma.rateLimitBucket.deleteMany({ where: { OR: identities.flatMap((email) => [...bucketPairs(email), ...registerBucketPairs(email)]) } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.auditLog.deleteMany({ where: {
    OR: [
      { userId },
      ...identities.map((email) => ({ metadata: { path: ["emailHash"], equals: hashSensitiveValue(email) } })),
    ],
  } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

beforeAll(async () => {
  assertTestDatabaseEnvironment(process.env);
  process.env.RATE_LIMIT_HMAC_SECRET = secret;
  await removeFixtures();
  await prisma.user.create({ data: { id: userId, name: "Synthetic Login User", email: userEmail, passwordHash: await hashPassword(password) } });
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-07T12:00:00.000Z"));
  runtime.cookieSet.mockClear();
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

describe("login rate limiting with real PostgreSQL", () => {
  it("does not consume buckets for structurally invalid forms", async () => {
    const result = await loginAction({ message: null }, form("invalid-email"));
    expect(result).toMatchObject({ message: "Revise os campos para continuar." });
    expect(await prisma.rateLimitBucket.count({ where: { OR: identities.flatMap((email) => [...bucketPairs(email), ...registerBucketPairs(email)]) } })).toBe(0);
  });

  it("normalizes identity, allows five attempts, blocks the sixth, and recovers in a new burst window", async () => {
    const variants = [`  ${missingEmail.toUpperCase()}  `, missingEmail, missingEmail, missingEmail, missingEmail];
    for (const email of variants) {
      await expect(loginAction({ message: null }, form(email))).resolves.toEqual({ message: "Nao foi possivel entrar com essas credenciais." });
    }
    const blocked = await loginAction({ message: null }, form(missingEmail));
    expect(blocked).toEqual({ message: "Muitas tentativas. Aguarde antes de tentar novamente.", retryAfterSeconds: 60 });
    expect(JSON.stringify(blocked)).not.toContain(missingEmail);
    expect(JSON.stringify(blocked)).not.toContain(secret);
    const persistedBuckets = await prisma.rateLimitBucket.findMany({ where: { OR: bucketPairs(missingEmail) } });
    expect(JSON.stringify(persistedBuckets)).not.toContain(missingEmail);
    expect(JSON.stringify(persistedBuckets)).not.toContain(secret);
    expect(await prisma.auditLog.count({ where: { action: "LOGIN_FAILED", metadata: { path: ["emailHash"], equals: hashSensitiveValue(missingEmail) } } })).toBe(5);

    vi.setSystemTime(new Date("2026-08-07T12:01:00.000Z"));
    await expect(loginAction({ message: null }, form(missingEmail))).resolves.toEqual({ message: "Nao foi possivel entrar com essas credenciais." });
  });

  it("allows ten distributed attempts, blocks the eleventh sustained attempt, and recovers after fifteen minutes", async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      vi.setSystemTime(new Date(Date.UTC(2026, 7, 7, 12, 0, attempt * 61)));
      await expect(loginAction({ message: null }, form(longEmail))).resolves.toEqual({ message: "Nao foi possivel entrar com essas credenciais." });
    }
    vi.setSystemTime(new Date("2026-08-07T12:10:10.000Z"));
    await expect(loginAction({ message: null }, form(longEmail))).resolves.toEqual({
      message: "Muitas tentativas. Aguarde antes de tentar novamente.",
      retryAfterSeconds: 290,
    });
    vi.setSystemTime(new Date("2026-08-07T12:15:00.000Z"));
    await expect(loginAction({ message: null }, form(longEmail))).resolves.toEqual({ message: "Nao foi possivel entrar com essas credenciais." });
  });

  it("returns the same blocked response for existing and missing identities", async () => {
    vi.setSystemTime(new Date("2026-08-07T13:00:00.000Z"));
    for (const email of [userEmail, otherEmail]) {
      for (let attempt = 0; attempt < 6; attempt += 1) await applyLoginRateLimit(email);
    }
    const existing = await loginAction({ message: null }, form(userEmail, password));
    const missing = await loginAction({ message: null }, form(otherEmail));
    expect(existing).toEqual(missing);
    expect(existing).toEqual({ message: "Muitas tentativas. Aguarde antes de tentar novamente.", retryAfterSeconds: 60 });
  });

  it("keeps invalid counters, then a valid login resets only its identity and preserves session and audit behavior", async () => {
    vi.setSystemTime(new Date("2026-08-07T14:00:00.000Z"));
    await loginAction({ message: null }, form(userEmail));
    await loginAction({ message: null }, form(userEmail));
    await loginAction({ message: null }, form(otherEmail));
    await applyRegisterRateLimit(userEmail);
    const otherBucketsBefore = await prisma.rateLimitBucket.findMany({
      where: { OR: bucketPairs(otherEmail) },
      orderBy: [{ scope: "asc" }, { windowStart: "asc" }],
    });
    const registrationBucketsBefore = await prisma.rateLimitBucket.findMany({
      where: { OR: registerBucketPairs(userEmail) },
      orderBy: [{ scope: "asc" }, { windowStart: "asc" }],
    });

    await expect(loginAction({ message: null }, form(userEmail, password))).rejects.toThrow("synthetic redirect");
    expect(await prisma.rateLimitBucket.count({ where: { OR: bucketPairs(userEmail) } })).toBe(0);
    await expect(prisma.rateLimitBucket.findMany({
      where: { OR: bucketPairs(otherEmail) },
      orderBy: [{ scope: "asc" }, { windowStart: "asc" }],
    })).resolves.toEqual(otherBucketsBefore);
    await expect(prisma.rateLimitBucket.findMany({
      where: { OR: registerBucketPairs(userEmail) },
      orderBy: [{ scope: "asc" }, { windowStart: "asc" }],
    })).resolves.toEqual(registrationBucketsBefore);
    expect(await prisma.session.count({ where: { userId } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { userId, action: "USER_LOGIN" } })).toBe(1);
    expect(runtime.cookieSet).toHaveBeenCalledOnce();

    await expect(loginAction({ message: null }, form(userEmail))).resolves.toEqual({ message: "Nao foi possivel entrar com essas credenciais." });
    const buckets = await prisma.rateLimitBucket.findMany({ where: { OR: bucketPairs(userEmail) }, select: { count: true } });
    expect(buckets).toEqual([{ count: 1 }, { count: 1 }]);
  });
});
