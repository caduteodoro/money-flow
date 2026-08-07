import { applyIdentityRateLimit, type IdentityRateLimitOptions, type IdentityRateLimitResult } from "./identity-rate-limit";

export const REGISTER_RATE_LIMIT_POLICIES = [
  { scope: "register:identity:burst", limit: 3, windowMs: 15 * 60_000 },
  { scope: "register:identity:sustained", limit: 5, windowMs: 60 * 60_000 },
] as const;

export type RegisterRateLimitResult = IdentityRateLimitResult;

export function applyRegisterRateLimit(
  normalizedEmail: string,
  options: IdentityRateLimitOptions = {},
): Promise<RegisterRateLimitResult> {
  return applyIdentityRateLimit(normalizedEmail, REGISTER_RATE_LIMIT_POLICIES, options);
}
