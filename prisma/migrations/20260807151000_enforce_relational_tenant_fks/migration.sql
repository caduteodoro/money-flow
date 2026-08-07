BEGIN;

-- Replace global-ID foreign keys with tenant-scoped foreign keys.
ALTER TABLE "Category"
DROP CONSTRAINT "Category_parentId_fkey";

ALTER TABLE "CategoryRule"
DROP CONSTRAINT "CategoryRule_categoryId_fkey";

ALTER TABLE "StatementImport"
DROP CONSTRAINT "StatementImport_bankAccountId_fkey";

ALTER TABLE "Transaction"
DROP CONSTRAINT "Transaction_bankAccountId_fkey";

ALTER TABLE "Transaction"
DROP CONSTRAINT "Transaction_categoryId_fkey";

ALTER TABLE "Transaction"
DROP CONSTRAINT "Transaction_statementImportId_fkey";

ALTER TABLE "StatementImport"
ADD CONSTRAINT "StatementImport_bankAccountId_userId_fkey"
FOREIGN KEY ("bankAccountId", "userId")
REFERENCES "BankAccount"("id", "userId")
ON DELETE NO ACTION
ON UPDATE CASCADE;

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_bankAccountId_userId_fkey"
FOREIGN KEY ("bankAccountId", "userId")
REFERENCES "BankAccount"("id", "userId")
ON DELETE NO ACTION
ON UPDATE CASCADE;

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_statementImportId_userId_fkey"
FOREIGN KEY ("statementImportId", "userId")
REFERENCES "StatementImport"("id", "userId")
ON DELETE NO ACTION
ON UPDATE CASCADE;

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_categoryId_userId_fkey"
FOREIGN KEY ("categoryId", "userId")
REFERENCES "Category"("id", "userId")
ON DELETE NO ACTION
ON UPDATE CASCADE;

ALTER TABLE "Category"
ADD CONSTRAINT "Category_parentId_userId_fkey"
FOREIGN KEY ("parentId", "userId")
REFERENCES "Category"("id", "userId")
ON DELETE NO ACTION
ON UPDATE CASCADE;

ALTER TABLE "CategoryRule"
ADD CONSTRAINT "CategoryRule_categoryId_userId_fkey"
FOREIGN KEY ("categoryId", "userId")
REFERENCES "Category"("id", "userId")
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMIT;
