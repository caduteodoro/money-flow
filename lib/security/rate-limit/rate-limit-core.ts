import type { RateLimitDecision, RateLimitStore } from "./rate-limit-types";
import { RateLimitStorageUnavailableError } from "./rate-limit-types";

export interface CheckRateLimitInput {
  scope: string;
  keyDigest: string;
  limit: number;
  windowMs: number;
  now?: Date;
}

export async function checkRateLimit(store: RateLimitStore, input: CheckRateLimitInput): Promise<RateLimitDecision> {
  validateInput(input);

  const now = input.now ?? new Date();
  if (!Number.isFinite(now.getTime())) throw new TypeError("now must be a valid date");

  const windowStartMs = Math.floor(now.getTime() / input.windowMs) * input.windowMs;
  const windowStart = new Date(windowStartMs);
  const resetAt = new Date(windowStartMs + input.windowMs);
  const retryAfterSeconds = Math.max(0, Math.ceil((resetAt.getTime() - now.getTime()) / 1_000));

  try {
    const result = await store.consume({
      scope: input.scope,
      keyDigest: input.keyDigest,
      windowStart,
      expiresAt: resetAt,
      limit: input.limit,
    });

    if (!result.consumed) {
      return { status: "blocked", allowed: false, limit: input.limit, remaining: 0, resetAt, retryAfterSeconds };
    }

    return {
      status: "allowed",
      allowed: true,
      limit: input.limit,
      remaining: Math.max(0, input.limit - result.count),
      resetAt,
      retryAfterSeconds: 0,
    };
  } catch (error) {
    if (!(error instanceof RateLimitStorageUnavailableError)) throw error;
    return {
      status: "storage_unavailable",
      allowed: true,
      limit: input.limit,
      remaining: input.limit,
      resetAt,
      retryAfterSeconds: 0,
    };
  }
}

function validateInput(input: CheckRateLimitInput) {
  if (!input.scope.trim()) throw new TypeError("scope must not be empty");
  if (!/^[a-f0-9]{64}$/.test(input.keyDigest)) throw new TypeError("keyDigest must be a lowercase SHA-256 digest");
  if (!Number.isSafeInteger(input.limit) || input.limit <= 0) throw new TypeError("limit must be a positive safe integer");
  if (!Number.isSafeInteger(input.windowMs) || input.windowMs < 1_000) throw new TypeError("windowMs must be a safe integer of at least 1000");
}
