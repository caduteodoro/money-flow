import { describe, expect, it } from "vitest";

import { applyRegisterRateLimit, REGISTER_RATE_LIMIT_POLICIES } from "@/lib/security/rate-limit/register-rate-limit";
import type { RateLimitConsumeInput, RateLimitStore } from "@/lib/security/rate-limit/rate-limit-types";
import { RateLimitStorageUnavailableError } from "@/lib/security/rate-limit/rate-limit-types";

const secret = "synthetic-register-policy-secret-at-least-32-bytes";
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

  async reset() {
    return 0;
  }
}

describe("registration rate limit policy", () => {
  it("allows three attempts and blocks the fourth for fifteen minutes", async () => {
    const store = new MemoryStore();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(applyRegisterRateLimit("synthetic@example.invalid", { store, now: start, secret })).resolves.toMatchObject({ allowed: true });
    }
    await expect(applyRegisterRateLimit("synthetic@example.invalid", { store, now: start, secret })).resolves.toMatchObject({
      allowed: false,
      retryAfterSeconds: 900,
    });
    await expect(applyRegisterRateLimit("synthetic@example.invalid", { store, now: new Date("2026-08-07T12:15:00.000Z"), secret })).resolves.toMatchObject({ allowed: true });
  });

  it("allows five distributed attempts and blocks the sixth for the sustained window", async () => {
    const store = new MemoryStore();
    const offsets = [0, 901_000, 1_801_000, 2_701_000, 2_702_000];
    for (const offset of offsets) {
      await expect(applyRegisterRateLimit("synthetic@example.invalid", { store, now: new Date(start.getTime() + offset), secret })).resolves.toMatchObject({ allowed: true });
    }
    await expect(applyRegisterRateLimit("synthetic@example.invalid", { store, now: new Date(start.getTime() + 2_703_000), secret })).resolves.toMatchObject({
      allowed: false,
      retryAfterSeconds: 897,
    });
    await expect(applyRegisterRateLimit("synthetic@example.invalid", { store, now: new Date(start.getTime() + 3_600_000), secret })).resolves.toMatchObject({ allowed: true });
  });

  it("keeps registration scopes and identities isolated", async () => {
    const store = new MemoryStore();
    await applyRegisterRateLimit("first@example.invalid", { store, now: start, secret });
    await applyRegisterRateLimit("second@example.invalid", { store, now: start, secret });
    expect(store.buckets).toHaveLength(4);
    expect([...store.buckets.keys()].every((key) => key.startsWith("register:identity:"))).toBe(true);
    expect(REGISTER_RATE_LIMIT_POLICIES.map(({ scope }) => scope)).not.toContain("login:identity:burst");
  });

  it("combines blocked and unavailable policies safely", async () => {
    const failOpen: RateLimitStore = {
      consume: async ({ scope }) => {
        if (scope.endsWith("burst")) throw new RateLimitStorageUnavailableError();
        return { consumed: true, count: 1 };
      },
      reset: async () => 0,
    };
    await expect(applyRegisterRateLimit("synthetic@example.invalid", { store: failOpen, now: start, secret })).resolves.toMatchObject({ allowed: true, storageUnavailable: true });

    const blocked: RateLimitStore = {
      consume: async ({ scope }) => {
        if (scope.endsWith("burst")) throw new RateLimitStorageUnavailableError();
        return { consumed: false, count: 5 };
      },
      reset: async () => 0,
    };
    await expect(applyRegisterRateLimit("synthetic@example.invalid", { store: blocked, now: start, secret })).resolves.toMatchObject({ allowed: false });
  });

  it("does not convert programming or secret configuration failures into fail-open", async () => {
    const broken: RateLimitStore = { consume: async () => { throw new Error("programming failure"); }, reset: async () => 0 };
    await expect(applyRegisterRateLimit("synthetic@example.invalid", { store: broken, now: start, secret })).rejects.toThrow("programming failure");
    await expect(applyRegisterRateLimit("synthetic@example.invalid", { store: new MemoryStore(), now: start, secret: "short" })).rejects.toThrow("32 bytes");
  });
});
