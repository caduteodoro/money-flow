import "server-only";

import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "money_flow_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function getSessionCookie() {
  const cookieStore = await cookies();

  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}
