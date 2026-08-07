import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  reset: vi.fn(),
  findUser: vi.fn(),
  verifyPassword: vi.fn(),
  audit: vi.fn(),
  session: vi.fn(),
}));

vi.mock("@/lib/security/rate-limit/login-rate-limit", () => ({
  applyLoginRateLimit: dependencies.rateLimit,
  resetLoginRateLimit: dependencies.reset,
}));
vi.mock("@/lib/db/prisma", () => ({ prisma: { user: { findUnique: dependencies.findUser } } }));
vi.mock("@/lib/auth/password", () => ({ verifyPassword: dependencies.verifyPassword }));
vi.mock("@/lib/auth/audit", () => ({ AUTH_AUDIT_ACTIONS: { loginFailed: "LOGIN_FAILED", userLogin: "USER_LOGIN" }, recordAuthAuditLog: dependencies.audit }));
vi.mock("@/lib/auth/session", () => ({ createUserSession: dependencies.session }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { loginAction } from "@/app/login/actions";

function form(email: string, password = "synthetic-password") {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.rateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0, storageUnavailable: false });
  dependencies.reset.mockResolvedValue("reset");
  dependencies.findUser.mockResolvedValue(null);
});

describe("login action rate limit placement", () => {
  it("does not consume a bucket for structurally invalid input", async () => {
    await loginAction({ message: null }, form("invalid-email"));
    expect(dependencies.rateLimit).not.toHaveBeenCalled();
  });

  it("uses canonical normalization before limiting and queries only afterwards", async () => {
    const order: string[] = [];
    dependencies.rateLimit.mockImplementation(async () => { order.push("limit"); return { allowed: true, retryAfterSeconds: 0, storageUnavailable: false }; });
    dependencies.findUser.mockImplementation(async () => { order.push("query"); return null; });
    await loginAction({ message: null }, form("  SYNTHETIC@EXAMPLE.INVALID  "));
    expect(dependencies.rateLimit).toHaveBeenCalledWith("synthetic@example.invalid");
    expect(order).toEqual(["limit", "query"]);
  });

  it("does not query, compare passwords or audit credentials when blocked", async () => {
    dependencies.rateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 42, storageUnavailable: false });
    const result = await loginAction({ message: null }, form("synthetic@example.invalid"));
    expect(result).toEqual({ message: "Muitas tentativas. Aguarde antes de tentar novamente.", retryAfterSeconds: 42 });
    expect(dependencies.findUser).not.toHaveBeenCalled();
    expect(dependencies.verifyPassword).not.toHaveBeenCalled();
    expect(dependencies.audit).not.toHaveBeenCalled();
  });

  it("does not reset invalid credentials", async () => {
    dependencies.findUser.mockResolvedValue({ id: "synthetic-user", passwordHash: "synthetic-hash" });
    dependencies.verifyPassword.mockResolvedValue(false);
    await loginAction({ message: null }, form("synthetic@example.invalid"));
    expect(dependencies.reset).not.toHaveBeenCalled();
    expect(dependencies.audit).toHaveBeenCalledWith(expect.objectContaining({ action: "LOGIN_FAILED" }));
  });

  it("continues a valid login when reset reports recognized storage unavailability", async () => {
    dependencies.findUser.mockResolvedValue({ id: "synthetic-user", passwordHash: "synthetic-hash" });
    dependencies.verifyPassword.mockResolvedValue(true);
    dependencies.reset.mockResolvedValue("storage_unavailable");
    await loginAction({ message: null }, form("synthetic@example.invalid"));
    expect(dependencies.reset).toHaveBeenCalledWith("synthetic@example.invalid");
    expect(dependencies.session).toHaveBeenCalledWith("synthetic-user");
    expect(dependencies.audit).toHaveBeenCalledWith({ action: "USER_LOGIN", userId: "synthetic-user" });
  });

  it("does not hide an unexpected reset failure", async () => {
    dependencies.findUser.mockResolvedValue({ id: "synthetic-user", passwordHash: "synthetic-hash" });
    dependencies.verifyPassword.mockResolvedValue(true);
    dependencies.reset.mockRejectedValue(new Error("reset programming failure"));
    await expect(loginAction({ message: null }, form("synthetic@example.invalid"))).rejects.toThrow("reset programming failure");
    expect(dependencies.session).not.toHaveBeenCalled();
  });
});
