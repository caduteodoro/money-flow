-- AlterTable
ALTER TABLE "StatementImport" ADD COLUMN     "duplicateCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "invalidRowCount" INTEGER NOT NULL DEFAULT 0;
