export interface RateLimitConsumeInput {
  scope: string;
  keyDigest: string;
  windowStart: Date;
  expiresAt: Date;
  limit: number;
}

export interface RateLimitConsumeResult {
  consumed: boolean;
  count: number;
}

export interface RateLimitStore {
  consume(input: RateLimitConsumeInput): Promise<RateLimitConsumeResult>;
  reset(keys: RateLimitResetKey[]): Promise<number>;
}

export interface RateLimitResetKey {
  scope: string;
  keyDigest: string;
}

export class RateLimitStorageUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super("Rate limit storage is unavailable", options);
    this.name = "RateLimitStorageUnavailableError";
  }
}

interface RateLimitDecisionBase {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}

export type RateLimitDecision =
  | (RateLimitDecisionBase & { status: "allowed"; allowed: true })
  | (RateLimitDecisionBase & { status: "blocked"; allowed: false })
  | (RateLimitDecisionBase & { status: "storage_unavailable"; allowed: true });
