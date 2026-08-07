import { describe, expect, it } from "vitest";

import { checkRateLimit } from "@/lib/security/rate-limit/rate-limit-core";
import type { RateLimitConsumeInput, RateLimitStore } from "@/lib/security/rate-limit/rate-limit-types";
import { RateLimitStorageUnavailableError } from "@/lib/security/rate-limit/rate-limit-types";

class MemoryRateLimitStore implements RateLimitStore {
  readonly buckets = new Map<string, number>();

  async consume(input: RateLimitConsumeInput) {
    const key = `${input.scope}:${input.keyDigest}:${input.windowStart.toISOString()}`;
    const current = this.buckets.get(key) ?? 0;
    if (current >= input.limit) return { consumed: false, count: current };
    const count = current + 1;
    this.buckets.set(key, count);
    return { consumed: true, count };
  }

  async reset() {
    return 0;
  }
}

const baseInput = {
  scope: "login:account:burst",
  keyDigest: "a".repeat(64),
  limit: 2,
  windowMs: 60_000,
};

describe("rate limit core", () => {
  it("allows up to the limit and blocks subsequent attempts in a fixed window", async () => {
    const store = new MemoryRateLimitStore();
    const now = new Date("2026-08-07T12:00:10.000Z");

    await expect(checkRateLimit(store, { ...baseInput, now })).resolves.toMatchObject({ status: "allowed", remaining: 1 });
    await expect(checkRateLimit(store, { ...baseInput, now })).resolves.toMatchObject({ status: "allowed", remaining: 0 });
    await expect(checkRateLimit(store, { ...baseInput, now })).resolves.toMatchObject({
      status: "blocked",
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 50,
    });
    await expect(checkRateLimit(store, { ...baseInput, now })).resolves.toMatchObject({ status: "blocked" });
  });

  it("opens a deterministic new window with an injectable clock", async () => {
    const store = new MemoryRateLimitStore();
    const firstWindow = new Date("2026-08-07T12:00:59.999Z");
    const nextWindow = new Date("2026-08-07T12:01:00.000Z");

    await checkRateLimit(store, { ...baseInput, limit: 1, now: firstWindow });
    await expect(checkRateLimit(store, { ...baseInput, limit: 1, now: firstWindow })).resolves.toMatchObject({ status: "blocked" });
    await expect(checkRateLimit(store, { ...baseInput, limit: 1, now: nextWindow })).resolves.toMatchObject({ status: "allowed" });
  });

  it("keeps scopes isolated so complementary windows can coexist", async () => {
    const store = new MemoryRateLimitStore();
    const now = new Date("2026-08-07T12:00:00.000Z");

    await checkRateLimit(store, { ...baseInput, scope: "login:account:burst", limit: 1, now });
    const sustained = await checkRateLimit(store, {
      ...baseInput,
      scope: "login:account:sustained",
      limit: 5,
      windowMs: 3_600_000,
      now,
    });

    expect(sustained).toMatchObject({ status: "allowed", remaining: 4 });
    expect(store.buckets).toHaveLength(2);
  });

  it("keeps digests isolated and never returns their value", async () => {
    const store = new MemoryRateLimitStore();
    const now = new Date("2026-08-07T12:00:00.000Z");
    const first = await checkRateLimit(store, { ...baseInput, keyDigest: "a".repeat(64), limit: 1, now });
    const second = await checkRateLimit(store, { ...baseInput, keyDigest: "b".repeat(64), limit: 1, now });

    expect(first.status).toBe("allowed");
    expect(second.status).toBe("allowed");
    expect(JSON.stringify([first, second])).not.toContain("a".repeat(64));
    expect(store.buckets).toHaveLength(2);
  });

  it("fails open only for the explicit storage-unavailable error", async () => {
    const unavailable: RateLimitStore = { consume: async () => { throw new RateLimitStorageUnavailableError(); }, reset: async () => 0 };
    const broken: RateLimitStore = { consume: async () => { throw new Error("contract bug"); }, reset: async () => 0 };

    await expect(checkRateLimit(unavailable, { ...baseInput, now: new Date("2026-08-07T12:00:00.000Z") })).resolves.toMatchObject({
      status: "storage_unavailable",
      allowed: true,
    });
    await expect(checkRateLimit(broken, { ...baseInput })).rejects.toThrow("contract bug");
  });

  it.each([
    [{ ...baseInput, scope: "" }, "scope"],
    [{ ...baseInput, keyDigest: "" }, "keyDigest"],
    [{ ...baseInput, keyDigest: "raw@example.invalid" }, "keyDigest"],
    [{ ...baseInput, limit: 0 }, "limit"],
    [{ ...baseInput, windowMs: 999 }, "windowMs"],
  ])("rejects invalid input", async (input, field) => {
    await expect(checkRateLimit(new MemoryRateLimitStore(), input)).rejects.toThrow(field);
  });

  it("rejects an invalid clock instead of producing an inconsistent window", async () => {
    await expect(checkRateLimit(new MemoryRateLimitStore(), { ...baseInput, now: new Date(Number.NaN) })).rejects.toThrow("valid date");
  });
});
