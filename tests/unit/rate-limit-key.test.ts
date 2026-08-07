import { afterEach, describe, expect, it, vi } from "vitest";

import { createRateLimitKeyDigest } from "@/lib/security/rate-limit/rate-limit-key";

const secret = "synthetic-rate-limit-secret-32-bytes-minimum";

afterEach(() => vi.unstubAllEnvs());

describe("rate limit key digest", () => {
  it("creates a stable scoped HMAC-SHA256 digest without exposing the identifier", () => {
    const identifier = "synthetic.user@example.invalid";
    const first = createRateLimitKeyDigest({ scope: "login:account", normalizedIdentifier: identifier, secret });
    const second = createRateLimitKeyDigest({ scope: "login:account", normalizedIdentifier: identifier, secret });
    const otherScope = createRateLimitKeyDigest({ scope: "register:account", normalizedIdentifier: identifier, secret });
    const otherSecret = createRateLimitKeyDigest({ scope: "login:account", normalizedIdentifier: identifier, secret: `${secret}-different` });

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toContain(identifier);
    expect(otherScope).not.toBe(first);
    expect(otherSecret).not.toBe(first);
  });

  it("rejects missing or weak secrets", () => {
    expect(() => createRateLimitKeyDigest({ scope: "login", normalizedIdentifier: "synthetic", secret: "short" })).toThrow("32 bytes");
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "");
    expect(() => createRateLimitKeyDigest({ scope: "login", normalizedIdentifier: "synthetic" })).toThrow("32 bytes");
  });
});
