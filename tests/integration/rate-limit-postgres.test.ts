import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { checkRateLimit } from "@/lib/security/rate-limit/rate-limit-core";
import { createRateLimitKeyDigest } from "@/lib/security/rate-limit/rate-limit-key";
import { PostgresRateLimitStore } from "@/lib/security/rate-limit/postgres-rate-limit-store";
import { assertTestDatabaseEnvironment } from "../helpers/assert-test-database.mjs";

const prisma = new PrismaClient();
const scopes = [
  "integration-rate-limit:first",
  "integration-rate-limit:isolation-a",
  "integration-rate-limit:isolation-b",
  "integration-rate-limit:concurrency",
  "integration-rate-limit:windows",
  "integration-rate-limit:persistence",
  "integration-rate-limit:cleanup-expired",
  "integration-rate-limit:cleanup-live",
];
const secret = "synthetic-integration-secret-at-least-32-bytes";
const now = new Date("2026-08-07T12:00:10.000Z");

beforeAll(async () => {
  assertTestDatabaseEnvironment(process.env);
  await prisma.rateLimitBucket.deleteMany({ where: { scope: { in: scopes } } });
});

afterAll(async () => {
  await prisma.rateLimitBucket.deleteMany({ where: { scope: { in: scopes } } });
  await prisma.$disconnect();
});

describe("PostgreSQL rate limit store", () => {
  it("persists the first attempt and increments the same bucket without raw identifiers", async () => {
    const store = new PostgresRateLimitStore(prisma);
    const identifier = "synthetic.persistence@example.invalid";
    const keyDigest = createRateLimitKeyDigest({ scope: scopes[0], normalizedIdentifier: identifier, secret });

    await checkRateLimit(store, { scope: scopes[0], keyDigest, limit: 3, windowMs: 60_000, now });
    await checkRateLimit(store, { scope: scopes[0], keyDigest, limit: 3, windowMs: 60_000, now });

    const bucket = await prisma.rateLimitBucket.findUniqueOrThrow({
      where: { scope_keyDigest_windowStart: { scope: scopes[0], keyDigest, windowStart: new Date("2026-08-07T12:00:00.000Z") } },
    });
    expect(bucket.count).toBe(2);
    expect(JSON.stringify(bucket)).not.toContain(identifier);
  });

  it("isolates scope and digest", async () => {
    const store = new PostgresRateLimitStore(prisma);
    const digestA = "a".repeat(64);
    const digestB = "b".repeat(64);

    await checkRateLimit(store, { scope: scopes[1], keyDigest: digestA, limit: 1, windowMs: 60_000, now });
    await checkRateLimit(store, { scope: scopes[1], keyDigest: digestB, limit: 1, windowMs: 60_000, now });
    await checkRateLimit(store, { scope: scopes[2], keyDigest: digestA, limit: 1, windowMs: 60_000, now });

    const buckets = await prisma.rateLimitBucket.findMany({ where: { scope: { in: [scopes[1], scopes[2]] } } });
    expect(buckets).toHaveLength(3);
    expect(buckets.every((bucket) => bucket.count === 1)).toBe(true);
  });

  it("allows exactly the configured limit under concurrent contention", async () => {
    const store = new PostgresRateLimitStore(prisma);
    const keyDigest = "c".repeat(64);
    const decisions = await Promise.all(
      Array.from({ length: 25 }, () => checkRateLimit(store, { scope: scopes[3], keyDigest, limit: 10, windowMs: 60_000, now })),
    );

    expect(decisions.filter((decision) => decision.allowed)).toHaveLength(10);
    expect(decisions.filter((decision) => !decision.allowed)).toHaveLength(15);
    const bucket = await prisma.rateLimitBucket.findFirstOrThrow({ where: { scope: scopes[3], keyDigest } });
    expect(bucket.count).toBe(10);
  });

  it("persists separate buckets for consecutive fixed windows", async () => {
    const store = new PostgresRateLimitStore(prisma);
    const keyDigest = "9".repeat(64);
    await checkRateLimit(store, { scope: scopes[4], keyDigest, limit: 1, windowMs: 60_000, now });
    await checkRateLimit(store, { scope: scopes[4], keyDigest, limit: 1, windowMs: 60_000, now: new Date("2026-08-07T12:01:00.000Z") });

    expect(await prisma.rateLimitBucket.count({ where: { scope: scopes[4], keyDigest } })).toBe(2);
  });

  it("preserves the bucket across Prisma client and store recreation", async () => {
    const keyDigest = "d".repeat(64);
    const firstClient = new PrismaClient();
    await checkRateLimit(new PostgresRateLimitStore(firstClient), { scope: scopes[5], keyDigest, limit: 2, windowMs: 60_000, now });
    await firstClient.$disconnect();

    const secondClient = new PrismaClient();
    const decision = await checkRateLimit(new PostgresRateLimitStore(secondClient), { scope: scopes[5], keyDigest, limit: 2, windowMs: 60_000, now });
    await secondClient.$disconnect();
    expect(decision).toMatchObject({ status: "allowed", remaining: 0 });
  });

  it("removes only expired buckets in a bounded cleanup batch", async () => {
    await prisma.rateLimitBucket.createMany({ data: [
      { scope: scopes[6], keyDigest: "e".repeat(64), windowStart: new Date("2026-08-07T11:58:00.000Z"), expiresAt: new Date("2026-08-07T11:59:00.000Z"), count: 1 },
      { scope: scopes[7], keyDigest: "f".repeat(64), windowStart: new Date("2026-08-07T12:00:00.000Z"), expiresAt: new Date("2026-08-07T12:01:00.000Z"), count: 1 },
    ] });

    const removed = await new PostgresRateLimitStore(prisma).cleanupExpired(now, 1);
    expect(removed).toBe(1);
    expect(await prisma.rateLimitBucket.count({ where: { scope: scopes[6] } })).toBe(0);
    expect(await prisma.rateLimitBucket.count({ where: { scope: scopes[7] } })).toBe(1);
  });

  it("fails open explicitly when PostgreSQL storage is unavailable", async () => {
    const unavailableClient = new PrismaClient({ datasourceUrl: "postgresql://money_flow_test:synthetic@127.0.0.1:1/money_flow_test" });
    const decision = await checkRateLimit(new PostgresRateLimitStore(unavailableClient), {
      scope: "integration-rate-limit:unavailable",
      keyDigest: "0".repeat(64),
      limit: 1,
      windowMs: 60_000,
      now,
    });
    await unavailableClient.$disconnect();
    expect(decision).toMatchObject({ status: "storage_unavailable", allowed: true });
  });
});
