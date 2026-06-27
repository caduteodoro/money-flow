import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import {
  clearSessionCookie,
  getSessionCookie,
  SESSION_MAX_AGE_SECONDS,
  setSessionCookie,
} from "@/lib/auth/cookies";
import { getRequestMetadata } from "@/lib/auth/request-metadata";

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUserSession(userId: string) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const requestMetadata = await getRequestMetadata();

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: requestMetadata.userAgent,
      ipHash: requestMetadata.ipHash,
    },
  });

  await setSessionCookie(token, expiresAt);
}

export async function validateSessionToken(token: string) {
  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }

  return session;
}

export async function getCurrentSession() {
  const token = await getSessionCookie();

  if (!token) {
    return null;
  }

  return validateSessionToken(token);
}

export async function invalidateCurrentSession() {
  const token = await getSessionCookie();

  if (!token) {
    await clearSessionCookie();
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const session = await prisma.session
    .delete({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
      },
    })
    .catch(() => null);

  await clearSessionCookie();

  return session;
}
