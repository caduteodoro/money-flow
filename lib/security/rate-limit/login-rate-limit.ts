import { prisma } from "@/lib/db/prisma";

import { checkRateLimit } from "./rate-limit-core";
import { createRateLimitKeyDigest } from "./rate-limit-key";
import { PostgresRateLimitStore } from "./postgres-rate-limit-store";
import type { RateLimitDecision, RateLimitResetKey, RateLimitStore } from "./rate-limit-types";
import { RateLimitStorageUnavailableError } from "./rate-limit-types";

export const LOGIN_RATE_LIMIT_POLICIES = [
  { scope: "login:identity:burst", limit: 5, windowMs: 60_000 },
  { scope: "login:identity:sustained", limit: 10, windowMs: 15 * 60_000 },
] as const;

const defaultStore = new PostgresRateLimitStore(prisma);

export interface LoginRateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  storageUnavailable: boolean;
}

interface LoginRateLimitOptions {
  store?: RateLimitStore;
  now?: Date;
  secret?: string;
}

export async function applyLoginRateLimit(normalizedEmail: string, options: LoginRateLimitOptions = {}): Promise<LoginRateLimitResult> {
  const store = options.store ?? defaultStore;
  const decisions = await Promise.all(
    LOGIN_RATE_LIMIT_POLICIES.map((policy) => checkRateLimit(store, {
      ...policy,
      keyDigest: digestFor(policy.scope, normalizedEmail, options.secret),
      now: options.now,
    })),
  );
  const blocked = decisions.filter((decision): decision is Extract<RateLimitDecision, { status: "blocked" }> => decision.status === "blocked");

  return {
    allowed: blocked.length === 0,
    retryAfterSeconds: blocked.length === 0 ? 0 : Math.max(...blocked.map(({ retryAfterSeconds }) => retryAfterSeconds)),
    storageUnavailable: decisions.some(({ status }) => status === "storage_unavailable"),
  };
}

export async function resetLoginRateLimit(normalizedEmail: string, options: Pick<LoginRateLimitOptions, "store" | "secret"> = {}): Promise<"reset" | "storage_unavailable"> {
  const store = options.store ?? defaultStore;
  const keys: RateLimitResetKey[] = LOGIN_RATE_LIMIT_POLICIES.map(({ scope }) => ({
    scope,
    keyDigest: digestFor(scope, normalizedEmail, options.secret),
  }));

  try {
    await store.reset(keys);
    return "reset";
  } catch (error) {
    if (error instanceof RateLimitStorageUnavailableError) return "storage_unavailable";
    throw error;
  }
}

function digestFor(scope: string, normalizedEmail: string, secret?: string) {
  return createRateLimitKeyDigest({ scope, normalizedIdentifier: normalizedEmail, secret });
}
