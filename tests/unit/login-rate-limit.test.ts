import { describe, expect, it } from "vitest";

import { applyLoginRateLimit, LOGIN_RATE_LIMIT_POLICIES, resetLoginRateLimit } from "@/lib/security/rate-limit/login-rate-limit";
import type { RateLimitConsumeInput, RateLimitResetKey, RateLimitStore } from "@/lib/security/rate-limit/rate-limit-types";
import { RateLimitStorageUnavailableError } from "@/lib/security/rate-limit/rate-limit-types";

const secret = "synthetic-login-policy-secret-at-least-32-bytes";
const start = new Date("2026-08-07T12:00:00.000Z");

class MemoryStore implements RateLimitStore {
  readonly buckets = new Map<string, number>();

  async consume(input: RateLimitConsumeInput) {
    const key = `${input.scope}:${input.keyDigest}:${input.windowStart.toISOString()}`;
    const current = this.buckets.get(key) ?? 0;
    if (current >= input.limit) return { consumed: false, count: current };
    this.buckets.set(key, current + 1);
    return { consumed: true, count: current + 1 };
  }

  async reset(keys: RateLimitResetKey[]) {
    let removed = 0;
    for (const key of this.buckets.keys()) {
      if (keys.some(({ scope, keyDigest }) => key.startsWith(`${scope}:${keyDigest}:`))) {
        this.buckets.delete(key);
        removed += 1;
      }
    }
    return removed;
  }
}

describe("login rate limit policy composition", () => {
  it("consumes both policies and blocks the sixth attempt in the burst window", async () => {
    const store = new MemoryStore();
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await expect(applyLoginRateLimit("synthetic@example.invalid", { store, now: start, secret })).resolves.toMatchObject({ allowed: true });
    }
    await expect(applyLoginRateLimit("synthetic@example.invalid", { store, now: start, secret })).resolves.toMatchObject({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect([...store.buckets.keys()].some((key) => key.startsWith(`${LOGIN_RATE_LIMIT_POLICIES[0].scope}:`))).toBe(true);
    expect([...store.buckets.keys()].some((key) => key.startsWith(`${LOGIN_RATE_LIMIT_POLICIES[1].scope}:`))).toBe(true);
  });

  it("allows ten distributed attempts and blocks the eleventh in the sustained window", async () => {
    const store = new MemoryStore();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const now = new Date(start.getTime() + attempt * 61_000);
      await expect(applyLoginRateLimit("synthetic@example.invalid", { store, now, secret })).resolves.toMatchObject({ allowed: true });
    }
    const eleventh = await applyLoginRateLimit("synthetic@example.invalid", { store, now: new Date(start.getTime() + 610_000), secret });
    expect(eleventh).toMatchObject({ allowed: false, retryAfterSeconds: 290 });
    await expect(applyLoginRateLimit("synthetic@example.invalid", { store, now: new Date(start.getTime() + 900_000), secret })).resolves.toMatchObject({ allowed: true });
  });

  it("uses the greatest wait when both policies block", async () => {
    const store: RateLimitStore = {
      consume: async ({ scope }) => ({ consumed: false, count: scope.endsWith("burst") ? 5 : 10 }),
      reset: async () => 0,
    };
    const result = await applyLoginRateLimit("synthetic@example.invalid", { store, now: new Date("2026-08-07T12:00:30.000Z"), secret });
    expect(result).toMatchObject({ allowed: false, retryAfterSeconds: 870 });
  });

  it("fails open for one unavailable policy but never lets it override a block", async () => {
    const allowedStore: RateLimitStore = {
      consume: async ({ scope }) => {
        if (scope.endsWith("burst")) throw new RateLimitStorageUnavailableError();
        return { consumed: true, count: 1 };
      },
      reset: async () => 0,
    };
    await expect(applyLoginRateLimit("synthetic@example.invalid", { store: allowedStore, now: start, secret })).resolves.toMatchObject({
      allowed: true,
      storageUnavailable: true,
    });

    const blockedStore: RateLimitStore = {
      consume: async ({ scope }) => {
        if (scope.endsWith("burst")) throw new RateLimitStorageUnavailableError();
        return { consumed: false, count: 10 };
      },
      reset: async () => 0,
    };
    await expect(applyLoginRateLimit("synthetic@example.invalid", { store: blockedStore, now: start, secret })).resolves.toMatchObject({ allowed: false });
  });

  it("does not convert unexpected failures into fail-open", async () => {
    const store: RateLimitStore = { consume: async () => { throw new Error("programming failure"); }, reset: async () => 0 };
    await expect(applyLoginRateLimit("synthetic@example.invalid", { store, now: start, secret })).rejects.toThrow("programming failure");
  });

  it("resets only the requested identity and tolerates only recognized reset unavailability", async () => {
    const store = new MemoryStore();
    await applyLoginRateLimit("first@example.invalid", { store, now: start, secret });
    await applyLoginRateLimit("second@example.invalid", { store, now: start, secret });
    await expect(resetLoginRateLimit("first@example.invalid", { store, secret })).resolves.toBe("reset");
    expect(store.buckets).toHaveLength(2);

    const unavailable: RateLimitStore = { consume: async () => ({ consumed: true, count: 1 }), reset: async () => { throw new RateLimitStorageUnavailableError(); } };
    await expect(resetLoginRateLimit("first@example.invalid", { store: unavailable, secret })).resolves.toBe("storage_unavailable");
    const broken: RateLimitStore = { consume: async () => ({ consumed: true, count: 1 }), reset: async () => { throw new Error("reset bug"); } };
    await expect(resetLoginRateLimit("first@example.invalid", { store: broken, secret })).rejects.toThrow("reset bug");
  });
});
