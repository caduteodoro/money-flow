import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "@/middleware";
import nextConfig from "@/next.config";
import { GLOBAL_SECURITY_HEADERS, PROTECTED_CACHE_HEADERS } from "@/lib/security/response-headers";

describe("security response headers", () => {
  it("keeps transport headroom for the 2 MB CSV business limit", () => {
    expect(nextConfig.experimental?.serverActions?.bodySizeLimit).toBe("3mb");
  });

  it("applies the global hardening headers through Next configuration", async () => {
    const configured = await nextConfig.headers?.();

    expect(nextConfig.poweredByHeader).toBe(false);
    expect(configured).toEqual([
      {
        source: "/(.*)",
        headers: [...GLOBAL_SECURITY_HEADERS],
      },
    ]);
  });

  it.each([
    ["an unauthenticated redirect", new NextRequest("https://money-flow.example/dashboard")],
    [
      "an authenticated pass-through",
      new NextRequest("https://money-flow.example/dashboard", {
        headers: { cookie: "money_flow_session=synthetic-session-token" },
      }),
    ],
  ])("prevents caching for %s", (_scenario, request) => {
    const response = middleware(request);

    for (const { key, value } of PROTECTED_CACHE_HEADERS) {
      expect(response.headers.get(key)).toBe(value);
    }
  });
});
