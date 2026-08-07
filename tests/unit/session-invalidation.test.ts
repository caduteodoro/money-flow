import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  cookieValue: null as string | null,
  cookieSet: vi.fn(),
  deleteSession: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (dependencies.cookieValue ? { value: dependencies.cookieValue } : undefined),
    set: dependencies.cookieSet,
  }),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    session: {
      delete: dependencies.deleteSession,
    },
  },
}));

import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";
import { hashSessionToken, invalidateCurrentSession } from "@/lib/auth/session";

function recordNotFoundError() {
  return new Prisma.PrismaClientKnownRequestError("synthetic missing session", {
    code: "P2025",
    clientVersion: "synthetic",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.cookieValue = "synthetic-session-token";
  dependencies.deleteSession.mockResolvedValue({ id: "synthetic-session", userId: "synthetic-user" });
});

describe("current session invalidation", () => {
  it("deletes only the session selected by the current token hash before clearing the cookie", async () => {
    const result = await invalidateCurrentSession();

    expect(result).toEqual({ id: "synthetic-session", userId: "synthetic-user" });
    expect(dependencies.deleteSession).toHaveBeenCalledWith({
      where: { tokenHash: hashSessionToken("synthetic-session-token") },
      select: { id: true, userId: true },
    });
    expect(dependencies.cookieSet).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      "",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 }),
    );
  });

  it("treats an already absent session as an idempotent logout and clears the cookie", async () => {
    dependencies.deleteSession.mockRejectedValue(recordNotFoundError());

    await expect(invalidateCurrentSession()).resolves.toBeNull();
    expect(dependencies.cookieSet).toHaveBeenCalledOnce();
  });

  it("clears a stale cookie without querying when no token is present", async () => {
    dependencies.cookieValue = null;

    await expect(invalidateCurrentSession()).resolves.toBeNull();
    expect(dependencies.deleteSession).not.toHaveBeenCalled();
    expect(dependencies.cookieSet).toHaveBeenCalledOnce();
  });

  it("propagates persistence failures without clearing the cookie", async () => {
    dependencies.deleteSession.mockRejectedValue(new Error("synthetic database unavailable"));

    await expect(invalidateCurrentSession()).rejects.toThrow("synthetic database unavailable");
    expect(dependencies.cookieSet).not.toHaveBeenCalled();
  });
});
