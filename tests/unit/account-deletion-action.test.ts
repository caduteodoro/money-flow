import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  deleteAccount: vi.fn(),
  clearCookie: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth/current-user", () => ({ requireCurrentUser: dependencies.requireCurrentUser }));
vi.mock("@/lib/account/account-deletion-service", () => ({ deleteAccount: dependencies.deleteAccount }));
vi.mock("@/lib/auth/cookies", () => ({ clearSessionCookie: dependencies.clearCookie }));
vi.mock("next/navigation", () => ({ redirect: dependencies.redirect }));

import { deleteAccountAction } from "@/app/settings/actions";
import { initialAccountDeletionActionState } from "@/app/settings/account-deletion-state";

function form(currentPassword?: string, confirmation?: string, userId?: string) {
  const data = new FormData();
  if (currentPassword !== undefined) data.set("currentPassword", currentPassword);
  if (confirmation !== undefined) data.set("confirmation", confirmation);
  if (userId !== undefined) data.set("userId", userId);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.requireCurrentUser.mockResolvedValue({ id: "user-a", name: "Synthetic A", email: "a@example.test" });
  dependencies.deleteAccount.mockResolvedValue({ ok: true });
});

describe("account deletion action", () => {
  it("requires an authenticated user before validating the form", async () => {
    dependencies.requireCurrentUser.mockRejectedValue(new Error("synthetic unauthenticated redirect"));
    await expect(deleteAccountAction(initialAccountDeletionActionState, form())).rejects.toThrow("synthetic unauthenticated redirect");
    expect(dependencies.deleteAccount).not.toHaveBeenCalled();
  });

  it.each([
    ["empty phrase", "synthetic-password", ""],
    ["wrong phrase", "synthetic-password", "EXCLUIR CONTA"],
    ["different case", "synthetic-password", "excluir minha conta"],
    ["extra spaces", "synthetic-password", " EXCLUIR MINHA CONTA "],
    ["empty password", "", "EXCLUIR MINHA CONTA"],
  ])("rejects %s without persistence", async (_label, password, confirmation) => {
    const result = await deleteAccountAction(initialAccountDeletionActionState, form(password, confirmation));
    expect(result.status).toBe("error");
    expect(dependencies.deleteAccount).not.toHaveBeenCalled();
    expect(dependencies.clearCookie).not.toHaveBeenCalled();
  });

  it("ignores a forged userId and uses only the authenticated identity", async () => {
    await deleteAccountAction(initialAccountDeletionActionState, form("synthetic-password", "EXCLUIR MINHA CONTA", "user-b"));
    expect(dependencies.deleteAccount).toHaveBeenCalledWith({
      userId: "user-a",
      currentPassword: "synthetic-password",
      confirmation: "EXCLUIR MINHA CONTA",
    });
    expect(dependencies.clearCookie).toHaveBeenCalledOnce();
    expect(dependencies.redirect).toHaveBeenCalledWith("/account-deleted");
    expect(dependencies.deleteAccount.mock.invocationCallOrder[0]).toBeLessThan(dependencies.clearCookie.mock.invocationCallOrder[0]!);
    expect(dependencies.clearCookie.mock.invocationCallOrder[0]).toBeLessThan(dependencies.redirect.mock.invocationCallOrder[0]!);
  });

  it("keeps the cookie and returns a controlled error for a wrong password", async () => {
    dependencies.deleteAccount.mockResolvedValue({ ok: false, reason: "invalid_credentials" });
    const result = await deleteAccountAction(initialAccountDeletionActionState, form("wrong-password", "EXCLUIR MINHA CONTA"));
    expect(result).toMatchObject({ status: "error", message: "A senha atual esta incorreta." });
    expect(dependencies.clearCookie).not.toHaveBeenCalled();
    expect(dependencies.redirect).not.toHaveBeenCalled();
  });

  it("keeps the cookie and hides internal failures", async () => {
    dependencies.deleteAccount.mockRejectedValue(new Error("synthetic database detail"));
    const result = await deleteAccountAction(initialAccountDeletionActionState, form("synthetic-password", "EXCLUIR MINHA CONTA"));
    expect(result).toEqual({ status: "error", message: "Nao foi possivel excluir sua conta. Nenhum dado foi alterado." });
    expect(dependencies.clearCookie).not.toHaveBeenCalled();
    expect(dependencies.redirect).not.toHaveBeenCalled();
  });
});
