import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  importTransactions: vi.fn(),
  applyRules: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: dependencies.revalidatePath }));
vi.mock("@/lib/auth/current-user", () => ({
  requireCurrentUser: vi.fn(async () => ({ id: "synthetic-user", name: "Synthetic", email: "synthetic@example.test" })),
}));
vi.mock("@/lib/category-rules", () => ({
  applyCategoryRulesToUncategorizedTransactions: dependencies.applyRules,
}));
vi.mock("@/lib/imports/statement-import-service", () => ({
  buildStatementImportPreview: vi.fn(),
  importStatementTransactions: dependencies.importTransactions,
  StatementImportError: class StatementImportError extends Error {},
}));

import { confirmStatementImportAction } from "@/app/import/actions";

function uploadForm() {
  const data = new FormData();
  data.set("statementFile", new File(["date,title,amount\n"], "nubank.csv", { type: "text/csv" }));
  return data;
}

function summary(importedCount: number) {
  return { id: "import", status: "COMPLETED", importedCount } as const;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("confirm statement import applies rules automatically", () => {
  it("applies active rules after importing new transactions", async () => {
    dependencies.importTransactions.mockResolvedValue(summary(5));
    dependencies.applyRules.mockResolvedValue({ ok: true, data: { processedCount: 5, categorizedCount: 4, unmatchedCount: 1, activeRuleCount: 3 } });

    const state = await confirmStatementImportAction(undefined, uploadForm());

    expect(dependencies.applyRules).toHaveBeenCalledWith("synthetic-user");
    expect(state.status).toBe("success");
    expect(state.message).toBe("Importacao concluida. 4 transacoes categorizadas pelas regras.");
    expect(dependencies.revalidatePath).toHaveBeenCalledWith("/transactions");
  });

  it("skips rules when nothing new was imported", async () => {
    dependencies.importTransactions.mockResolvedValue(summary(0));

    const state = await confirmStatementImportAction(undefined, uploadForm());

    expect(dependencies.applyRules).not.toHaveBeenCalled();
    expect(state.message).toBe("Importacao concluida.");
  });

  it("keeps the import as success when applying rules fails", async () => {
    dependencies.importTransactions.mockResolvedValue(summary(2));
    dependencies.applyRules.mockResolvedValue({ ok: false, code: "UNEXPECTED_ERROR", message: "Erro." });

    const state = await confirmStatementImportAction(undefined, uploadForm());

    expect(state.status).toBe("success");
    expect(state.message).toContain("as regras nao puderam ser aplicadas agora");
  });
});
