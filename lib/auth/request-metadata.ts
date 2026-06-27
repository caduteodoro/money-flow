import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

export function hashSensitiveValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function firstForwardedIp(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

export async function getRequestMetadata() {
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent")?.slice(0, 512) ?? null;
  const ip =
    firstForwardedIp(headerStore.get("x-forwarded-for")) ??
    headerStore.get("x-real-ip") ??
    null;

  return {
    userAgent,
    userAgentHash: userAgent ? hashSensitiveValue(userAgent) : null,
    ipHash: ip ? hashSensitiveValue(ip) : null,
  };
}
