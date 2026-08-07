import { prisma } from "@/lib/db/prisma";

import { checkRateLimit } from "./rate-limit-core";
import { createRateLimitKeyDigest } from "./rate-limit-key";
import { PostgresRateLimitStore } from "./postgres-rate-limit-store";
import type { RateLimitDecision, RateLimitResetKey, RateLimitStore } from "./rate-limit-types";

export interface IdentityRateLimitPolicy {
  scope: string;
  limit: number;
  windowMs: number;
}

export interface IdentityRateLimitOptions {
  store?: RateLimitStore;
  now?: Date;
  secret?: string;
}

export interface IdentityRateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  storageUnavailable: boolean;
}

export const persistentRateLimitStore = new PostgresRateLimitStore(prisma);

export async function applyIdentityRateLimit(
  normalizedIdentifier: string,
  policies: readonly IdentityRateLimitPolicy[],
  options: IdentityRateLimitOptions = {},
): Promise<IdentityRateLimitResult> {
  if (policies.length === 0) throw new TypeError("at least one rate limit policy is required");
  const store = options.store ?? persistentRateLimitStore;
  const decisions = await Promise.all(
    policies.map((policy) => checkRateLimit(store, {
      ...policy,
      keyDigest: digestFor(policy.scope, normalizedIdentifier, options.secret),
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

export function createRateLimitPolicyKeys(
  normalizedIdentifier: string,
  policies: readonly IdentityRateLimitPolicy[],
  secret?: string,
): RateLimitResetKey[] {
  return policies.map(({ scope }) => ({
    scope,
    keyDigest: digestFor(scope, normalizedIdentifier, secret),
  }));
}

function digestFor(scope: string, normalizedIdentifier: string, secret?: string) {
  return createRateLimitKeyDigest({ scope, normalizedIdentifier, secret });
}
