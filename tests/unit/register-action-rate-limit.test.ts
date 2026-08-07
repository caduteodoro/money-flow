import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  hashPassword: vi.fn(),
  createUser: vi.fn(),
  audit: vi.fn(),
  session: vi.fn(),
}));

vi.mock("@/lib/security/rate-limit/register-rate-limit", () => ({ applyRegisterRateLimit: dependencies.rateLimit }));
vi.mock("@/lib/auth/password", () => ({ hashPassword: dependencies.hashPassword }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { user: { create: dependencies.createUser } } }));
vi.mock("@/lib/auth/audit", () => ({ AUTH_AUDIT_ACTIONS: { userRegistered: "USER_REGISTERED" }, recordAuthAuditLog: dependencies.audit }));
vi.mock("@/lib/auth/session", () => ({ createUserSession: dependencies.session }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { registerAction } from "@/app/register/actions";

function form(email: string, password = "synthetic-password") {
  const data = new FormData();
  data.set("name", "Synthetic User");
  data.set("email", email);
  data.set("password", password);
  data.set("confirmPassword", password);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.rateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0, storageUnavailable: false });
  dependencies.hashPassword.mockResolvedValue("synthetic-hash");
  dependencies.createUser.mockResolvedValue({ id: "synthetic-user" });
});

describe("registration action rate limit placement", () => {
  it("does not consume buckets for structurally invalid input", async () => {
    await registerAction({ message: null }, form("invalid-email"));
    expect(dependencies.rateLimit).not.toHaveBeenCalled();
  });

  it("normalizes before limiting and limits before bcrypt and persistence", async () => {
    const order: string[] = [];
    dependencies.rateLimit.mockImplementation(async () => { order.push("limit"); return { allowed: true, retryAfterSeconds: 0, storageUnavailable: false }; });
    dependencies.hashPassword.mockImplementation(async () => { order.push("bcrypt"); return "synthetic-hash"; });
    dependencies.createUser.mockImplementation(async () => { order.push("create"); return { id: "synthetic-user" }; });
    await registerAction({ message: null }, form("  SYNTHETIC@EXAMPLE.INVALID  "));
    expect(dependencies.rateLimit).toHaveBeenCalledWith("synthetic@example.invalid");
    expect(order).toEqual(["limit", "bcrypt", "create"]);
  });

  it("does not hash, persist, create a session or audit when blocked", async () => {
    dependencies.rateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 42, storageUnavailable: false });
    const result = await registerAction({ message: null }, form("synthetic@example.invalid"));
    expect(result).toEqual({ message: "Muitas tentativas de cadastro. Aguarde antes de tentar novamente.", retryAfterSeconds: 42 });
    expect(dependencies.hashPassword).not.toHaveBeenCalled();
    expect(dependencies.createUser).not.toHaveBeenCalled();
    expect(dependencies.session).not.toHaveBeenCalled();
    expect(dependencies.audit).not.toHaveBeenCalled();
  });

  it("continues the existing flow after an explicit storage fail-open result", async () => {
    dependencies.rateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0, storageUnavailable: true });
    await registerAction({ message: null }, form("synthetic@example.invalid"));
    expect(dependencies.createUser).toHaveBeenCalled();
    expect(dependencies.audit).toHaveBeenCalledWith({ action: "USER_REGISTERED", userId: "synthetic-user" });
    expect(dependencies.session).toHaveBeenCalledWith("synthetic-user");
  });
});
