import { createHmac } from "node:crypto";

export interface CreateRateLimitKeyDigestInput {
  scope: string;
  normalizedIdentifier: string;
  secret?: string;
}

export function createRateLimitKeyDigest(input: CreateRateLimitKeyDigestInput): string {
  const scope = input.scope.trim();
  const identifier = input.normalizedIdentifier.trim();
  const secret = input.secret ?? process.env.RATE_LIMIT_HMAC_SECRET;

  if (!scope) throw new TypeError("scope must not be empty");
  if (!identifier) throw new TypeError("normalizedIdentifier must not be empty");
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new TypeError("RATE_LIMIT_HMAC_SECRET must contain at least 32 bytes");
  }

  return createHmac("sha256", secret).update(`v1:${scope}:${identifier}`, "utf8").digest("hex");
}
