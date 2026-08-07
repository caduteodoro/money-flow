BEGIN;

-- Composite candidate keys required by the tenant-scoped foreign keys.
CREATE UNIQUE INDEX "BankAccount_id_userId_key"
ON "BankAccount"("id", "userId");

CREATE UNIQUE INDEX "Category_id_userId_key"
ON "Category"("id", "userId");

CREATE UNIQUE INDEX "StatementImport_id_userId_key"
ON "StatementImport"("id", "userId");

COMMIT;
