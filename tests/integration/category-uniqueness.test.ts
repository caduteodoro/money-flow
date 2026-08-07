import { Prisma, PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  createCategory,
  createChildCategory,
  updateCategory,
} from "@/lib/categories";
import { normalizeCategoryNameForComparison } from "@/lib/categories/category-validation";
import { categoryFixture } from "@/tests/helpers/category-fixture";

const prisma = new PrismaClient();
const userAId = "integration-category-unique-user-a";
const userBId = "integration-category-unique-user-b";
const userIds = [userAId, userBId];

type CategoryMutation = Awaited<ReturnType<typeof createCategory>>;

async function cleanupCategories() {
  await prisma.category.deleteMany({
    where: { userId: { in: userIds }, parentId: { not: null } },
  });
  await prisma.category.deleteMany({ where: { userId: { in: userIds } } });
}

async function cleanupFixtures() {
  await cleanupCategories();
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

function expectControlledDuplicate(result: CategoryMutation) {
  expect(result).toEqual({
    ok: false,
    code: "DUPLICATE_NAME",
    message: "Ja existe uma categoria com esse nome neste nivel.",
  });
}

function expectKnownUniqueError(error: unknown, expectedTarget: string[]) {
  expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  const prismaError = error as Prisma.PrismaClientKnownRequestError;
  expect(prismaError.code).toBe("P2002");
  const target = Array.isArray(prismaError.meta?.target) ? prismaError.meta.target : [];
  expect(new Set(target)).toEqual(new Set(expectedTarget));
}

async function captureError(operation: () => Promise<unknown>) {
  try {
    await operation();
  } catch (error) {
    return error;
  }

  throw new Error("Expected the database operation to fail.");
}

async function waitForBlockedCategoryWrites(verb: "INSERT" | "UPDATE", expected: number) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const [status] = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid <> pg_backend_pid()
        AND wait_event_type = 'Lock'
        AND query ILIKE ${`%${verb}%Category%`}
    `;

    if ((status?.count ?? 0) >= expected) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  throw new Error(`Timed out waiting for ${expected} blocked ${verb} statements.`);
}

async function forceConcurrentCategoryWrites(
  verb: "INSERT" | "UPDATE",
  operations: Array<() => Promise<CategoryMutation>>,
) {
  let signalLockAcquired!: () => void;
  let releaseLock!: () => void;
  const lockAcquired = new Promise<void>((resolve) => {
    signalLockAcquired = resolve;
  });
  const lockReleased = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  const lock = prisma.$transaction(
    async (transaction) => {
      await transaction.$executeRawUnsafe('LOCK TABLE "Category" IN SHARE ROW EXCLUSIVE MODE');
      signalLockAcquired();
      await lockReleased;
    },
    { timeout: 15_000 },
  );

  await lockAcquired;
  const pending = operations.map((operation) => operation());

  try {
    await waitForBlockedCategoryWrites(verb, operations.length);
  } finally {
    releaseLock();
  }

  await lock;
  return Promise.all(pending);
}

beforeAll(async () => {
  await cleanupFixtures();
  await prisma.user.createMany({
    data: [
      {
        id: userAId,
        name: "Synthetic Category Uniqueness User A",
        email: "category-uniqueness-a@example.test",
        passwordHash: "synthetic-password-hash-a",
      },
      {
        id: userBId,
        name: "Synthetic Category Uniqueness User B",
        email: "category-uniqueness-b@example.test",
        passwordHash: "synthetic-password-hash-b",
      },
    ],
  });
});

beforeEach(async () => {
  await cleanupCategories();
});

afterAll(async () => {
  try {
    await cleanupFixtures();
  } finally {
    await prisma.$disconnect();
  }
});

describe("structural category uniqueness", () => {
  it("keeps the TypeScript and PostgreSQL backfill keys identical", async () => {
    const corpus = [
      " Alimentação ",
      "ALIMENTAÇÃO",
      "alimentacao",
      "Casa   e\tMoradia",
      "Casa\r\ne Moradia",
      "\u00a0Lazer\u00a0",
      "\u1680Saúde\u1680",
      "\u2000Transporte\u2003",
      "\u2028Educação\u2029",
      "\u202fViagem\u205f",
      "\u3000Receitas\u3000",
      "\ufeffOutros\ufeff",
      "I İ ı i",
      "ÁÉÍÓÚ Ç Ã Õ",
    ];
    const backfillQuery = `
      SELECT LOWER(
        BTRIM(
          REGEXP_REPLACE(
            $1,
            U&'[\\0009-\\000D\\0020\\00A0\\1680\\2000-\\200A\\2028\\2029\\202F\\205F\\3000\\FEFF]+',
            ' ',
            'g'
          )
        ) COLLATE "pt-BR-x-icu"
      ) AS "comparisonKey"
    `;

    for (const name of corpus) {
      const [row] = await prisma.$queryRawUnsafe<Array<{ comparisonKey: string }>>(
        backfillQuery,
        name,
      );

      expect(row?.comparisonKey).toBe(normalizeCategoryNameForComparison(name));
    }
  });

  it("enforces root equivalence while preserving accents and tenant separation", async () => {
    const first = await createCategory({ userId: userAId, name: "  Casa  " });
    expect(first).toMatchObject({ ok: true, data: { name: "Casa", parentId: null } });

    expectControlledDuplicate(await createCategory({ userId: userAId, name: "cAsA" }));
    expect(await createCategory({ userId: userAId, name: "Avó" })).toMatchObject({ ok: true });
    expect(await createCategory({ userId: userAId, name: "Avo" })).toMatchObject({ ok: true });
    expect(await createCategory({ userId: userBId, name: " CASA " })).toMatchObject({ ok: true });

    await expect(
      prisma.category.count({
        where: {
          userId: userAId,
          comparisonKey: normalizeCategoryNameForComparison("Casa"),
          parentId: null,
        },
      }),
    ).resolves.toBe(1);
  });

  it("allows child names across distinct scopes but rejects equivalent siblings", async () => {
    const parentA1 = await createCategory({ userId: userAId, name: "Parent A1" });
    const parentA2 = await createCategory({ userId: userAId, name: "Parent A2" });
    const parentB = await createCategory({ userId: userBId, name: "Parent B" });
    expect(parentA1.ok && parentA2.ok && parentB.ok).toBe(true);
    if (!parentA1.ok || !parentA2.ok || !parentB.ok) return;

    expect(await createCategory({ userId: userAId, name: "Shared" })).toMatchObject({ ok: true });
    expect(
      await createChildCategory({
        userId: userAId,
        parentCategoryId: parentA1.data.id,
        name: "Shared",
      }),
    ).toMatchObject({ ok: true });
    expectControlledDuplicate(
      await createChildCategory({
        userId: userAId,
        parentCategoryId: parentA1.data.id,
        name: "  SHARED ",
      }),
    );
    expect(
      await createChildCategory({
        userId: userAId,
        parentCategoryId: parentA2.data.id,
        name: "shared",
      }),
    ).toMatchObject({ ok: true });
    expect(
      await createChildCategory({
        userId: userBId,
        parentCategoryId: parentB.data.id,
        name: "SHARED",
      }),
    ).toMatchObject({ ok: true });
  });

  it("serializes equivalent concurrent root and child creations with controlled errors", async () => {
    const rootResults = await forceConcurrentCategoryWrites("INSERT", [
      () => createCategory({ userId: userAId, name: "Cartão de crédito" }),
      () => createCategory({ userId: userAId, name: "  CARTÃO   DE CRÉDITO " }),
    ]);
    expect(rootResults.filter((result) => result.ok)).toHaveLength(1);
    expectControlledDuplicate(rootResults.find((result) => !result.ok)!);

    const parent = await createCategory({ userId: userAId, name: "Concurrent Parent" });
    expect(parent.ok).toBe(true);
    if (!parent.ok) return;

    const childResults = await forceConcurrentCategoryWrites("INSERT", [
      () =>
        createChildCategory({
          userId: userAId,
          parentCategoryId: parent.data.id,
          name: "Transportes",
        }),
      () =>
        createChildCategory({
          userId: userAId,
          parentCategoryId: parent.data.id,
          name: " transportes ",
        }),
    ]);
    expect(childResults.filter((result) => result.ok)).toHaveLength(1);
    expectControlledDuplicate(childResults.find((result) => !result.ok)!);

    await expect(
      prisma.category.count({
        where: {
          userId: userAId,
          comparisonKey: normalizeCategoryNameForComparison("Transportes"),
          parentId: parent.data.id,
        },
      }),
    ).resolves.toBe(1);
  });

  it("keeps rejected sequential and concurrent renames fully intact", async () => {
    const available = await createCategory({ userId: userAId, name: "Rename Source" });
    const occupied = await createCategory({ userId: userAId, name: "Moradia" });
    expect(available.ok && occupied.ok).toBe(true);
    if (!available.ok || !occupied.ok) return;

    expect(
      await updateCategory({
        userId: userAId,
        categoryId: available.data.id,
        name: "Available Rename",
      }),
    ).toMatchObject({ ok: true, data: { name: "Available Rename" } });
    const beforeRejectedRename = await prisma.category.findUniqueOrThrow({
      where: { id: available.data.id },
    });
    expectControlledDuplicate(
      await updateCategory({
        userId: userAId,
        categoryId: available.data.id,
        name: "  MORADIA ",
      }),
    );
    await expect(
      prisma.category.findUniqueOrThrow({ where: { id: available.data.id } }),
    ).resolves.toEqual(beforeRejectedRename);

    const first = await createCategory({ userId: userAId, name: "Concurrent Rename A" });
    const second = await createCategory({ userId: userAId, name: "Concurrent Rename B" });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    const originals = await prisma.category.findMany({
      where: { id: { in: [first.data.id, second.data.id] } },
      orderBy: { id: "asc" },
    });

    const renameResults = await forceConcurrentCategoryWrites("UPDATE", [
      () =>
        updateCategory({
          userId: userAId,
          categoryId: first.data.id,
          name: "Concurrent Target",
        }),
      () =>
        updateCategory({
          userId: userAId,
          categoryId: second.data.id,
          name: "  CONCURRENT   TARGET ",
        }),
    ]);
    expect(renameResults.filter((result) => result.ok)).toHaveLength(1);
    expectControlledDuplicate(renameResults.find((result) => !result.ok)!);

    const records = await prisma.category.findMany({
      where: { id: { in: [first.data.id, second.data.id] } },
      orderBy: { id: "asc" },
    });
    expect(
      records.filter(
        ({ comparisonKey }) =>
          comparisonKey === normalizeCategoryNameForComparison("Concurrent Target"),
      ),
    ).toHaveLength(1);
    expect(records.filter((record) => originals.some((original) =>
      original.id === record.id &&
      original.name === record.name &&
      original.comparisonKey === record.comparisonKey &&
      original.updatedAt.getTime() === record.updatedAt.getTime(),
    ))).toHaveLength(1);
  });

  it("enforces both unique indexes through Prisma and direct SQL", async () => {
    const parentA = categoryFixture({
      id: "integration-category-unique-parent-a",
      userId: userAId,
      name: "Direct Parent A",
    });
    const parentA2 = categoryFixture({
      id: "integration-category-unique-parent-a2",
      userId: userAId,
      name: "Direct Parent A2",
    });
    await prisma.category.createMany({ data: [parentA, parentA2] });

    const root = categoryFixture({
      id: "integration-category-unique-root",
      userId: userAId,
      name: "Direct Root",
    });
    await prisma.category.create({ data: root });
    const rootError = await captureError(() =>
      prisma.category.create({
        data: categoryFixture({
          id: "integration-category-unique-root-duplicate",
          userId: userAId,
          name: "DIRECT ROOT",
        }),
      }),
    );
    expectKnownUniqueError(rootError, ["userId", "comparisonKey"]);

    const child = categoryFixture({
      id: "integration-category-unique-child",
      userId: userAId,
      parentId: parentA.id,
      name: "Direct Child",
    });
    await prisma.category.create({ data: child });
    const childError = await captureError(() =>
      prisma.category.create({
        data: categoryFixture({
          id: "integration-category-unique-child-duplicate",
          userId: userAId,
          parentId: parentA.id,
          name: " direct child ",
        }),
      }),
    );
    expectKnownUniqueError(childError, ["userId", "comparisonKey", "parentId"]);

    await expect(
      prisma.$executeRaw`
        INSERT INTO "Category" ("id", "userId", "name", "comparisonKey", "updatedAt")
        VALUES (
          'integration-category-unique-root-sql-duplicate',
          ${userAId},
          'Direct Root SQL duplicate',
          ${root.comparisonKey},
          CURRENT_TIMESTAMP
        )
      `,
    ).rejects.toBeDefined();

    await expect(
      prisma.category.create({
        data: categoryFixture({
          id: "integration-category-unique-child-other-parent",
          userId: userAId,
          parentId: parentA2.id,
          name: "DIRECT CHILD",
        }),
      }),
    ).resolves.toBeDefined();
    await expect(
      prisma.category.create({
        data: categoryFixture({
          id: "integration-category-unique-root-other-user",
          userId: userBId,
          name: "direct root",
        }),
      }),
    ).resolves.toBeDefined();
  });

  it("preserves the six tenant-scoped foreign keys from Activity 5.1", async () => {
    const constraints = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT conname AS name
      FROM pg_constraint
      WHERE conname IN (
        'Category_parentId_userId_fkey',
        'CategoryRule_categoryId_userId_fkey',
        'StatementImport_bankAccountId_userId_fkey',
        'Transaction_bankAccountId_userId_fkey',
        'Transaction_categoryId_userId_fkey',
        'Transaction_statementImportId_userId_fkey'
      )
      ORDER BY conname
    `;

    expect(constraints.map(({ name }) => name)).toEqual([
      "CategoryRule_categoryId_userId_fkey",
      "Category_parentId_userId_fkey",
      "StatementImport_bankAccountId_userId_fkey",
      "Transaction_bankAccountId_userId_fkey",
      "Transaction_categoryId_userId_fkey",
      "Transaction_statementImportId_userId_fkey",
    ]);
  });
});
