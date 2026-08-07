import { applyIdentityRateLimit, createRateLimitPolicyKeys, persistentRateLimitStore, type IdentityRateLimitOptions, type IdentityRateLimitResult } from "./identity-rate-limit";
import { RateLimitStorageUnavailableError } from "./rate-limit-types";

export const LOGIN_RATE_LIMIT_POLICIES = [
  { scope: "login:identity:burst", limit: 5, windowMs: 60_000 },
  { scope: "login:identity:sustained", limit: 10, windowMs: 15 * 60_000 },
] as const;

export type LoginRateLimitResult = IdentityRateLimitResult;
export type LoginRateLimitOptions = IdentityRateLimitOptions;

export async function applyLoginRateLimit(normalizedEmail: string, options: LoginRateLimitOptions = {}): Promise<LoginRateLimitResult> {
  return applyIdentityRateLimit(normalizedEmail, LOGIN_RATE_LIMIT_POLICIES, options);
}

export async function resetLoginRateLimit(normalizedEmail: string, options: Pick<LoginRateLimitOptions, "store" | "secret"> = {}): Promise<"reset" | "storage_unavailable"> {
  const store = options.store ?? persistentRateLimitStore;
  const keys = createRateLimitPolicyKeys(normalizedEmail, LOGIN_RATE_LIMIT_POLICIES, options.secret);

  try {
    await store.reset(keys);
    return "reset";
  } catch (error) {
    if (error instanceof RateLimitStorageUnavailableError) return "storage_unavailable";
    throw error;
  }
}
