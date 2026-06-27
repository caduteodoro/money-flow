import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "money_flow_session";

export function middleware(request: NextRequest) {
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
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
