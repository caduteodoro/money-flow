import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  createRule: vi.fn(),
  toggleRule: vi.fn(),
  applyRules: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: dependencies.revalidatePath }));
vi.mock("@/lib/auth/current-user", () => ({
  requireCurrentUser: vi.fn(async () => ({ id: "synthetic-user", name: "Synthetic", email: "synthetic@example.test" })),
}));
vi.mock("@/lib/category-rules", () => ({
  createCategoryRule: dependencies.createRule,
  toggleCategoryRule: dependencies.toggleRule,
  applyCategoryRulesToUncategorizedTransactions: dependencies.applyRules,
}));

import { createCategoryRuleAction, toggleCategoryRuleAction } from "@/app/categories/rule-actions";

const appliedSummary = { processedCount: 4, categorizedCount: 3, unmatchedCount: 1, activeRuleCount: 2 };

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.applyRules.mockResolvedValue({ ok: true, data: appliedSummary });
});

describe("category rule actions apply rules automatically", () => {
  it("applies active rules right after a rule is created", async () => {
    dependencies.createRule.mockResolvedValue({ ok: true, data: { id: "rule" } });

    const state = await createCategoryRuleAction({ status: "idle" }, formData({ matchText: "uber", categoryId: "cat", priority: "1" }));

    expect(dependencies.applyRules).toHaveBeenCalledWith("synthetic-user");
    expect(state).toEqual({ status: "success", message: "Regra criada com sucesso. 3 transacoes categorizadas.", summary: appliedSummary });
    expect(dependencies.revalidatePath).toHaveBeenCalledWith("/transactions");
  });

  it("does not apply rules when rule creation fails", async () => {
    dependencies.createRule.mockResolvedValue({ ok: false, code: "DUPLICATE_RULE", message: "Regra duplicada." });

    const state = await createCategoryRuleAction({ status: "idle" }, formData({ matchText: "uber", categoryId: "cat", priority: "1" }));

    expect(dependencies.applyRules).not.toHaveBeenCalled();
    expect(state.status).toBe("error");
  });

  it("keeps the created rule as success when applying fails", async () => {
    dependencies.createRule.mockResolvedValue({ ok: true, data: { id: "rule" } });
    dependencies.applyRules.mockResolvedValue({ ok: false, code: "UNEXPECTED_ERROR", message: "Erro." });

    const state = await createCategoryRuleAction({ status: "idle" }, formData({ matchText: "uber", categoryId: "cat", priority: "1" }));

    expect(state.status).toBe("success");
    expect(state.message).toContain("nao foi possivel aplica-la agora");
  });

  it("applies active rules when a rule is reactivated", async () => {
    dependencies.toggleRule.mockResolvedValue({ ok: true, data: { id: "rule", isActive: true } });
    dependencies.applyRules.mockResolvedValue({ ok: true, data: { ...appliedSummary, categorizedCount: 1 } });

    const state = await toggleCategoryRuleAction({ status: "idle" }, formData({ ruleId: "rule", isActive: "true" }));

    expect(dependencies.applyRules).toHaveBeenCalledWith("synthetic-user");
    expect(state.message).toBe("Regra ativada. 1 transacao categorizada.");
  });

  it("does not apply rules when a rule is deactivated", async () => {
    dependencies.toggleRule.mockResolvedValue({ ok: true, data: { id: "rule", isActive: false } });

    const state = await toggleCategoryRuleAction({ status: "idle" }, formData({ ruleId: "rule", isActive: "false" }));

    expect(dependencies.applyRules).not.toHaveBeenCalled();
    expect(state).toEqual({ status: "success", message: "Regra desativada." });
  });
});
