"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { applyCategoryRulesToUncategorizedTransactions } from "@/lib/category-rules";
import {
  buildStatementImportPreview,
  importStatementTransactions,
  StatementImportError,
  type StatementImportPreview,
  type StatementImportSummary,
  type StatementUploadInput,
} from "@/lib/imports/statement-import-service";

export type ImportActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  preview?: StatementImportPreview;
  summary?: StatementImportSummary;
};

const initialState: ImportActionState = {
  status: "idle",
  message: null,
};

export async function previewStatementImportAction(
  previousState: ImportActionState = initialState,
  formData: FormData,
): Promise<ImportActionState> {
  void previousState;

  try {
    const user = await requireCurrentUser();
    const uploadInput = await buildUploadInput(user.id, formData);
    const preview = await buildStatementImportPreview(uploadInput);

    return {
      status: "success",
      message: "Preview gerado. Confira as linhas antes de confirmar.",
      preview,
    };
  } catch (error) {
    return {
      status: "error",
      message: getFriendlyErrorMessage(error),
    };
  }
}

export async function confirmStatementImportAction(
  previousState: ImportActionState = initialState,
  formData: FormData,
): Promise<ImportActionState> {
  void previousState;

  try {
    const user = await requireCurrentUser();
    const uploadInput = await buildUploadInput(user.id, formData);
    const summary = await importStatementTransactions(uploadInput);
    const message = await applyRulesAfterImport(user.id, summary.importedCount);

    revalidatePath("/import");
    revalidatePath("/transactions");

    return {
      status: "success",
      message,
      summary,
    };
  } catch (error) {
    return {
      status: "error",
      message: getFriendlyErrorMessage(error),
    };
  }
}

async function applyRulesAfterImport(userId: string, importedCount: number) {
  if (importedCount === 0) {
    return "Importacao concluida.";
  }

  const applied = await applyCategoryRulesToUncategorizedTransactions(userId);

  if (!applied.ok) {
    return "Importacao concluida, mas as regras nao puderam ser aplicadas agora. Use \"Aplicar regras\" em Categorias.";
  }

  const { categorizedCount } = applied.data;
  const categorizedText =
    categorizedCount === 1 ? "1 transacao categorizada" : `${categorizedCount} transacoes categorizadas`;

  return `Importacao concluida. ${categorizedText} pelas regras.`;
}

async function buildUploadInput(userId: string, formData: FormData): Promise<StatementUploadInput> {
  const file = formData.get("statementFile");

  if (!(file instanceof File)) {
    throw new StatementImportError("Selecione um arquivo CSV.");
  }

  return {
    userId,
    fileName: file.name,
    mimeType: file.type || undefined,
    fileBuffer: Buffer.from(await file.arrayBuffer()),
  };
}

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof StatementImportError) {
    return error.message;
  }

  return "Nao foi possivel processar o CSV. Verifique o arquivo e tente novamente.";
}
