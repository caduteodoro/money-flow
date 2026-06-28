/*
  Warnings:

  - Added the required column `updatedAt` to the `StatementImport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StatementImport" ADD COLUMN     "fileSizeBytes" INTEGER,
ADD COLUMN     "sourceProvider" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "descriptionHash" TEXT;

-- CreateIndex
CREATE INDEX "StatementImport_userId_fileHash_idx" ON "StatementImport"("userId", "fileHash");

-- CreateIndex
CREATE INDEX "StatementImport_userId_status_createdAt_idx" ON "StatementImport"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_descriptionHash_idx" ON "Transaction"("userId", "descriptionHash");
