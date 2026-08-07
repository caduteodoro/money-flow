import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type CookieWrite = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

const runtime = vi.hoisted(() => ({
  cookieValue: null as string | null,
  cookieWrites: [] as CookieWrite[],
  redirectTargets: [] as string[],
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (runtime.cookieValue ? { value: runtime.cookieValue } : undefined),
    set: (name: string, value: string, options: Record<string, unknown>) => {
      runtime.cookieWrites.push({ name, value, options });
      runtime.cookieValue = value || null;
    },
  }),
  headers: async () => ({ get: () => null }),
}));
vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    runtime.redirectTargets.push(target);
    throw new Error("synthetic redirect");
  },
}));

import { logoutAction } from "@/app/logout/actions";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/cookies";
import { hashPassword } from "@/lib/auth/password";
import { createUserSession, hashSessionToken, validateSessionToken } from "@/lib/auth/session";
import { assertTestDatabaseEnvironment } from "../helpers/assert-test-database.mjs";

const prisma = new PrismaClient();
const userId = "integration-session-logout-user";
const userEmail = "session-logout-user@example.test";

async function removeFixtures() {
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.auditLog.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

beforeAll(async () => {
  assertTestDatabaseEnvironment(process.env);
  await removeFixtures();
  await prisma.user.create({
    data: {
      id: userId,
      name: "Synthetic Session User",
      email: userEmail,
      passwordHash: await hashPassword("synthetic-session-password"),
    },
  });
});

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-07T18:00:00.000Z"));
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.auditLog.deleteMany({ where: { userId } });
  runtime.cookieValue = null;
  runtime.cookieWrites.length = 0;
  runtime.redirectTargets.length = 0;
});

afterAll(async () => {
  vi.useRealTimers();
  try {
    await removeFixtures();
  } finally {
    await prisma.$disconnect();
  }
});

describe("sessions and logout with real PostgreSQL", () => {
  it("stores only token hashes, keeps thirty-day cookies, and revokes only the current session", async () => {
    await createUserSession(userId);
    const firstToken = runtime.cookieValue;
    await createUserSession(userId);
    const secondToken = runtime.cookieValue;

    expect(firstToken).toBeTruthy();
    expect(secondToken).toBeTruthy();
    expect(secondToken).not.toBe(firstToken);

    const sessionsBefore = await prisma.session.findMany({ where: { userId }, orderBy: { tokenHash: "asc" } });
    expect(sessionsBefore).toHaveLength(2);
    expect(sessionsBefore.map(({ tokenHash }) => tokenHash).sort()).toEqual(
      [hashSessionToken(firstToken!), hashSessionToken(secondToken!)].sort(),
    );
    expect(JSON.stringify(sessionsBefore)).not.toContain(firstToken);
    expect(JSON.stringify(sessionsBefore)).not.toContain(secondToken);
    expect(sessionsBefore.every(({ expiresAt }) => expiresAt.getTime() === Date.now() + SESSION_MAX_AGE_SECONDS * 1000)).toBe(true);
    expect(runtime.cookieWrites[0]).toMatchObject({
      name: SESSION_COOKIE_NAME,
      value: firstToken,
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      },
    });

    runtime.cookieValue = firstToken;
    await expect(logoutAction()).rejects.toThrow("synthetic redirect");

    expect(runtime.redirectTargets).toEqual(["/login"]);
    expect(await prisma.session.findUnique({ where: { tokenHash: hashSessionToken(firstToken!) } })).toBeNull();
    expect(await prisma.session.findUnique({ where: { tokenHash: hashSessionToken(secondToken!) } })).not.toBeNull();
    expect(await validateSessionToken(secondToken!)).not.toBeNull();
    expect(await prisma.auditLog.count({ where: { userId, action: "USER_LOGOUT" } })).toBe(1);
    expect(runtime.cookieWrites.at(-1)).toMatchObject({
      name: SESSION_COOKIE_NAME,
      value: "",
      options: { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 },
    });
  });

  it("keeps logout idempotent when the session is already absent", async () => {
    runtime.cookieValue = "synthetic-absent-session-token";

    await expect(logoutAction()).rejects.toThrow("synthetic redirect");

    expect(runtime.redirectTargets).toEqual(["/login"]);
    expect(runtime.cookieValue).toBeNull();
    expect(await prisma.auditLog.count({ where: { userId, action: "USER_LOGOUT" } })).toBe(0);
  });

  it("handles an absent cookie without changing persisted sessions", async () => {
    await createUserSession(userId);
    const activeToken = runtime.cookieValue;
    runtime.cookieValue = null;
    runtime.cookieWrites.length = 0;

    await expect(logoutAction()).rejects.toThrow("synthetic redirect");

    expect(await prisma.session.findUnique({ where: { tokenHash: hashSessionToken(activeToken!) } })).not.toBeNull();
    expect(await prisma.auditLog.count({ where: { userId, action: "USER_LOGOUT" } })).toBe(0);
    expect(runtime.cookieWrites.at(-1)).toMatchObject({ name: SESSION_COOKIE_NAME, value: "" });
  });

  it("rejects and removes an expired persisted session", async () => {
    const expiredToken = "synthetic-expired-session-token";
    await prisma.session.create({
      data: {
        id: "integration-session-expired",
        userId,
        tokenHash: hashSessionToken(expiredToken),
        expiresAt: new Date(Date.now() - 1),
      },
    });

    await expect(validateSessionToken(expiredToken)).resolves.toBeNull();
    expect(await prisma.session.findUnique({ where: { id: "integration-session-expired" } })).toBeNull();
  });
});
