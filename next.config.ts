import type { NextConfig } from "next";

import { GLOBAL_SECURITY_HEADERS } from "./lib/security/response-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [...GLOBAL_SECURITY_HEADERS],
      },
    ];
  },
};

export default nextConfig;
