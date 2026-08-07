import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  invalidate: vi.fn(),
  audit: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ invalidateCurrentSession: dependencies.invalidate }));
vi.mock("@/lib/auth/audit", () => ({
  AUTH_AUDIT_ACTIONS: { userLogout: "USER_LOGOUT" },
  recordAuthAuditLog: dependencies.audit,
}));
vi.mock("next/navigation", () => ({ redirect: dependencies.redirect }));

import { logoutAction } from "@/app/logout/actions";

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.invalidate.mockResolvedValue({ id: "synthetic-session", userId: "synthetic-user" });
});

describe("logout action", () => {
  it("audits a revoked current session and redirects to login", async () => {
    await logoutAction();

    expect(dependencies.audit).toHaveBeenCalledWith({ action: "USER_LOGOUT", userId: "synthetic-user" });
    expect(dependencies.redirect).toHaveBeenCalledWith("/login");
  });

  it("keeps an absent session idempotent without a false audit event", async () => {
    dependencies.invalidate.mockResolvedValue(null);

    await logoutAction();

    expect(dependencies.audit).not.toHaveBeenCalled();
    expect(dependencies.redirect).toHaveBeenCalledWith("/login");
  });

  it("does not audit or redirect when revocation fails", async () => {
    dependencies.invalidate.mockRejectedValue(new Error("synthetic revocation failure"));

    await expect(logoutAction()).rejects.toThrow("synthetic revocation failure");
    expect(dependencies.audit).not.toHaveBeenCalled();
    expect(dependencies.redirect).not.toHaveBeenCalled();
  });
});
