import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { applyHeaders, PROTECTED_CACHE_HEADERS } from "@/lib/security/response-headers";

const SESSION_COOKIE_NAME = "money_flow_session";

export function middleware(request: NextRequest) {
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);

    applyHeaders(response.headers, PROTECTED_CACHE_HEADERS);

    return response;
  }

  const response = NextResponse.next();

  applyHeaders(response.headers, PROTECTED_CACHE_HEADERS);

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/import/:path*",
    "/transactions/:path*",
    "/categories/:path*",
    "/settings/:path*",
  ],
};
