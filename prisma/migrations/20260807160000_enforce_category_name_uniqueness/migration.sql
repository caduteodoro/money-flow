BEGIN;

-- Keep the visible name intact while persisting the application's pt-BR comparison key.
ALTER TABLE "Category"
ADD COLUMN "comparisonKey" TEXT;

UPDATE "Category"
SET "comparisonKey" = LOWER(
  BTRIM(
    REGEXP_REPLACE(
      "name",
      U&'[\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]+',
      ' ',
      'g'
    )
  ) COLLATE "pt-BR-x-icu"
);

-- Abort atomically if pre-existing rows are equivalent in either supported scope.
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Category"
    WHERE "parentId" IS NULL
    GROUP BY "userId", "comparisonKey"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Category uniqueness migration blocked by equivalent root categories.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Category"
    WHERE "parentId" IS NOT NULL
    GROUP BY "userId", "comparisonKey", "parentId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Category uniqueness migration blocked by equivalent child categories.';
  END IF;
END
$migration$;

ALTER TABLE "Category"
ALTER COLUMN "comparisonKey" SET NOT NULL;

CREATE UNIQUE INDEX "Category_child_userId_comparisonKey_parentId_key"
ON "Category"("userId", "comparisonKey", "parentId");

CREATE UNIQUE INDEX "Category_root_userId_comparisonKey_key"
ON "Category"("userId", "comparisonKey")
WHERE "parentId" IS NULL;

-- The normalized guarantees are active before the previous exact-name index is removed.
DROP INDEX "Category_userId_name_parentId_key";

COMMIT;
