import "server-only";

import { prisma } from "@/lib/db/prisma";
import { generateDedupeKey, generateFileHash } from "@/lib/parsers/normalization";
import { parseStatement } from "@/lib/parsers/parser-registry";
import type { NormalizedStatementTransaction } from "@/lib/parsers/statement-parser";

const MAX_CSV_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_CSV_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
  "application/octet-stream",
]);

export type StatementUploadInput = {
  userId: string;
  bankAccountId?: string;
  fileName: string;
  mimeType?: string;
  fileBuffer: Buffer;
};

export type StatementPreviewRow = {
  sourceRowNumber: number;
  occurredAt: string;
  description: string;
  amountCents: number;
  direction: string;
  duplicate: boolean;
};

export type StatementImportPreview = {
  fileHash: string;
  fileSizeBytes: number;
  fileName: string;
  parserId: string;
  sourceProvider: string;
  rowCount: number;
  duplicateCount: number;
  invalidRowCount: number;
  warnings: { row?: number; message: string }[];
  transactions: StatementPreviewRow[];
};

export type StatementImportSummary = {
  id: string;
  status: string;
  sourceProvider: string | null;
  rowCount: number;
  importedCount: number;
  duplicateCount: number;
  invalidRowCount: number;
  skippedCount: number;
  createdAt: string;
};

type PreparedTransaction = NormalizedStatementTransaction & {
  dedupeKey: string;
  duplicate: boolean;
};

type PreparedStatementImport = StatementImportPreview & {
  transactionsToImport: PreparedTransaction[];
};

export async function buildStatementImportPreview(input: StatementUploadInput): Promise<StatementImportPreview> {
  const preparedImport = await prepareStatementImport(input);

  return {
    fileHash: preparedImport.fileHash,
    fileSizeBytes: preparedImport.fileSizeBytes,
    fileName: preparedImport.fileName,
    parserId: preparedImport.parserId,
    sourceProvider: preparedImport.sourceProvider,
    rowCount: preparedImport.rowCount,
    duplicateCount: preparedImport.duplicateCount,
    invalidRowCount: preparedImport.invalidRowCount,
    warnings: preparedImport.warnings,
    transactions: preparedImport.transactions,
  };
}

export async function importStatementTransactions(input: StatementUploadInput) {
  const preparedImport = await prepareStatementImport(input);

  if (input.bankAccountId) {
    await assertBankAccountBelongsToUser(input.userId, input.bankAccountId);
  }

  const transactionsToCreate = preparedImport.transactionsToImport.filter((transaction) => !transaction.duplicate);

  const statementImport = await prisma.$transaction(async (tx) => {
    const statementImport = await tx.statementImport.create({
      data: {
        userId: input.userId,
        bankAccountId: input.bankAccountId,
        format: "CSV",
        status: "COMPLETED",
        sourceProvider: preparedImport.sourceProvider,
        originalFileName: preparedImport.fileName,
        fileHash: preparedImport.fileHash,
        fileSizeBytes: preparedImport.fileSizeBytes,
        rowCount: preparedImport.rowCount,
        importedCount: transactionsToCreate.length,
        duplicateCount: preparedImport.duplicateCount,
        invalidRowCount: preparedImport.invalidRowCount,
        skippedCount: preparedImport.duplicateCount + preparedImport.invalidRowCount,
        completedAt: new Date(),
      },
    });

    if (transactionsToCreate.length > 0) {
      await tx.transaction.createMany({
        data: transactionsToCreate.map((transaction) => ({
          userId: input.userId,
          bankAccountId: input.bankAccountId,
          statementImportId: statementImport.id,
          occurredAt: transaction.occurredAt,
          postedAt: transaction.postedAt,
          description: transaction.description,
          normalizedDescription: transaction.normalizedDescription,
          descriptionHash: transaction.descriptionHash,
          amountCents: transaction.amountCents,
          currency: transaction.currency,
          direction: transaction.direction,
          dedupeKey: transaction.dedupeKey,
        })),
        skipDuplicates: true,
      });
    }

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        action: "STATEMENT_IMPORTED",
        entityType: "StatementImport",
        entityId: statementImport.id,
        metadata: {
          format: "CSV",
          sourceProvider: preparedImport.sourceProvider,
          fileHash: preparedImport.fileHash,
          fileSizeBytes: preparedImport.fileSizeBytes,
          rowCount: preparedImport.rowCount,
          importedCount: transactionsToCreate.length,
          duplicateCount: preparedImport.duplicateCount,
          invalidRowCount: preparedImport.invalidRowCount,
          skippedCount: preparedImport.duplicateCount + preparedImport.invalidRowCount,
        },
      },
    });

    return statementImport;
  });

  return {
    id: statementImport.id,
    status: statementImport.status,
    sourceProvider: statementImport.sourceProvider,
    rowCount: statementImport.rowCount,
    importedCount: statementImport.importedCount,
    duplicateCount: statementImport.duplicateCount,
    invalidRowCount: statementImport.invalidRowCount,
    skippedCount: statementImport.skippedCount,
    createdAt: statementImport.createdAt.toISOString(),
  } satisfies StatementImportSummary;
}

export async function getStatementImportHistory(userId: string): Promise<StatementImportSummary[]> {
  const imports = await prisma.statementImport.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      status: true,
      sourceProvider: true,
      rowCount: true,
      importedCount: true,
      duplicateCount: true,
      invalidRowCount: true,
      skippedCount: true,
      createdAt: true,
    },
  });

  return imports.map((statementImport) => ({
    ...statementImport,
    createdAt: statementImport.createdAt.toISOString(),
  }));
}

async function prepareStatementImport(input: StatementUploadInput): Promise<PreparedStatementImport> {
  validateStatementUpload(input);

  const fileContent = decodeUtf8(input.fileBuffer);
  const parsedStatement = parseStatement({
    content: fileContent,
    fileName: input.fileName,
    mimeType: input.mimeType,
  });
  const fileHash = generateFileHash(input.fileBuffer);
  const transactionsWithDedupe = parsedStatement.transactions.map((transaction) => ({
    ...transaction,
    dedupeKey: generateDedupeKey({
      sourceProvider: parsedStatement.sourceProvider,
      occurredAt: transaction.occurredAt,
      amountCents: transaction.amountCents,
      descriptionHash: transaction.descriptionHash,
      externalId: transaction.externalId,
    }),
  }));
  const existingDedupeKeys = await findExistingDedupeKeys(
    input.userId,
    transactionsWithDedupe.map((transaction) => transaction.dedupeKey),
  );
  const seenDedupeKeys = new Set<string>();
  const transactionsToImport = transactionsWithDedupe.map((transaction) => {
    const duplicate = existingDedupeKeys.has(transaction.dedupeKey) || seenDedupeKeys.has(transaction.dedupeKey);
    seenDedupeKeys.add(transaction.dedupeKey);

    return {
      ...transaction,
      duplicate,
    };
  });

  return {
    fileHash,
    fileSizeBytes: input.fileBuffer.length,
    fileName: sanitizeFileName(input.fileName),
    parserId: parsedStatement.parserId,
    sourceProvider: parsedStatement.sourceProvider,
    rowCount: parsedStatement.transactions.length + parsedStatement.warnings.length,
    duplicateCount: transactionsToImport.filter((transaction) => transaction.duplicate).length,
    invalidRowCount: parsedStatement.warnings.length,
    warnings: parsedStatement.warnings,
    transactions: transactionsToImport.map((transaction) => ({
      sourceRowNumber: transaction.sourceRowNumber,
      occurredAt: transaction.occurredAt.toISOString().slice(0, 10),
      description: transaction.description,
      amountCents: transaction.amountCents,
      direction: transaction.direction,
      duplicate: transaction.duplicate,
    })),
    transactionsToImport,
  };
}

function validateStatementUpload(input: StatementUploadInput) {
  if (!input.userId) {
    throw new Error("Usuario autenticado obrigatorio.");
  }

  if (!input.fileBuffer || input.fileBuffer.length === 0) {
    throw new Error("Arquivo CSV vazio.");
  }

  if (input.fileBuffer.length > MAX_CSV_FILE_SIZE_BYTES) {
    throw new Error("Arquivo CSV acima do tamanho maximo permitido.");
  }

  if (!input.fileName.toLowerCase().endsWith(".csv")) {
    throw new Error("Apenas arquivos CSV sao aceitos nesta etapa.");
  }

  if (input.mimeType && !ALLOWED_CSV_MIME_TYPES.has(input.mimeType.toLowerCase())) {
    throw new Error("Tipo de arquivo CSV nao reconhecido.");
  }

  if (input.fileBuffer.includes(0)) {
    throw new Error("Arquivo CSV invalido.");
  }
}

function decodeUtf8(fileBuffer: Buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(fileBuffer);
  } catch {
    throw new Error("CSV deve estar codificado em UTF-8.");
  }
}

function sanitizeFileName(fileName: string) {
  return fileName.trim().replace(/[^\w.\- ]/g, "").slice(0, 120) || "statement.csv";
}

async function findExistingDedupeKeys(userId: string, dedupeKeys: string[]) {
  if (dedupeKeys.length === 0) {
    return new Set<string>();
  }

  const existingTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      dedupeKey: {
        in: dedupeKeys,
      },
    },
    select: {
      dedupeKey: true,
    },
  });

  return new Set(existingTransactions.map((transaction) => transaction.dedupeKey));
}

async function assertBankAccountBelongsToUser(userId: string, bankAccountId: string) {
  const bankAccount = await prisma.bankAccount.findFirst({
    where: {
      id: bankAccountId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!bankAccount) {
    throw new Error("Conta bancaria nao encontrada.");
  }
}
