import {
  Prisma,
  PrismaClient,
  StatementFormat,
  TransactionDirection,
} from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  categoryFixture,
  categoryNameFields,
} from "@/tests/helpers/category-fixture";

const prisma = new PrismaClient();

const ids = {
  userA: "integration-relational-user-a",
  userB: "integration-relational-user-b",
  userC: "integration-relational-user-c",
  bankA: "integration-relational-bank-a",
  bankB: "integration-relational-bank-b",
  importA: "integration-relational-import-a",
  importB: "integration-relational-import-b",
  importNull: "integration-relational-import-null",
  transactionA: "integration-relational-transaction-a",
  transactionB: "integration-relational-transaction-b",
  transactionNull: "integration-relational-transaction-null",
  parentA: "integration-relational-parent-a",
  childA: "integration-relational-child-a",
  categoryB: "integration-relational-category-b",
  ruleA: "integration-relational-rule-a",
  ruleB: "integration-relational-rule-b",
  invalidParent: "integration-relational-invalid-parent",
  invalidRule: "integration-relational-invalid-rule",
  invalidTransactionCategory: "integration-relational-invalid-transaction-category",
  invalidTransactionBank: "integration-relational-invalid-transaction-bank",
  invalidTransactionImport: "integration-relational-invalid-transaction-import",
  invalidStatementImportBank: "integration-relational-invalid-statement-import-bank",
  noActionParent: "integration-relational-no-action-parent",
  noActionChild: "integration-relational-no-action-child",
  noActionTransactionCategory: "integration-relational-no-action-transaction-category",
  noActionCategoryTransaction: "integration-relational-no-action-category-transaction",
  noActionTransactionBank: "integration-relational-no-action-transaction-bank",
  noActionBankTransaction: "integration-relational-no-action-bank-transaction",
  noActionTransactionImport: "integration-relational-no-action-transaction-import",
  noActionImportTransaction: "integration-relational-no-action-import-transaction",
  noActionStatementImportBank: "integration-relational-no-action-statement-import-bank",
  noActionBankStatementImport: "integration-relational-no-action-bank-statement-import",
  cascadeCategory: "integration-relational-cascade-category",
  cascadeRule: "integration-relational-cascade-rule",
  bankC: "integration-relational-bank-c",
  importC: "integration-relational-import-c",
  transactionC: "integration-relational-transaction-c",
  parentC: "integration-relational-parent-c",
  childC: "integration-relational-child-c",
  ruleC: "integration-relational-rule-c",
} as const;

const allUserIds = [ids.userA, ids.userB, ids.userC];
const allBankIds = [
  ids.bankA,
  ids.bankB,
  ids.noActionTransactionBank,
  ids.noActionStatementImportBank,
  ids.bankC,
];
const allImportIds = [
  ids.importA,
  ids.importB,
  ids.importNull,
  ids.invalidStatementImportBank,
  ids.noActionTransactionImport,
  ids.noActionBankStatementImport,
  ids.importC,
];
const allTransactionIds = [
  ids.transactionA,
  ids.transactionB,
  ids.transactionNull,
  ids.invalidTransactionCategory,
  ids.invalidTransactionBank,
  ids.invalidTransactionImport,
  ids.noActionCategoryTransaction,
  ids.noActionBankTransaction,
  ids.noActionImportTransaction,
  ids.transactionC,
];
const allRuleIds = [
  ids.ruleA,
  ids.ruleB,
  ids.invalidRule,
  ids.cascadeRule,
  ids.ruleC,
];
const allCategoryIds = [
  ids.parentA,
  ids.childA,
  ids.categoryB,
  ids.invalidParent,
  ids.noActionParent,
  ids.noActionChild,
  ids.noActionTransactionCategory,
  ids.cascadeCategory,
  ids.parentC,
  ids.childC,
];

const userBPrivateMarker = "SYNTHETIC-TENANT-B-PRIVATE-MARKER";

async function cleanupSyntheticFixtures() {
  await prisma.transaction.deleteMany({ where: { id: { in: allTransactionIds } } });
  await prisma.categoryRule.deleteMany({ where: { id: { in: allRuleIds } } });
  await prisma.statementImport.deleteMany({ where: { id: { in: allImportIds } } });
  await prisma.category.updateMany({
    where: { id: { in: allCategoryIds } },
    data: { parentId: null },
  });
  await prisma.category.deleteMany({ where: { id: { in: allCategoryIds } } });
  await prisma.bankAccount.deleteMany({ where: { id: { in: allBankIds } } });
  await prisma.user.deleteMany({ where: { id: { in: allUserIds } } });
}

function transactionData(id: string, userId: string, dedupeKey: string) {
  return {
    id,
    userId,
    occurredAt: new Date("2026-08-07T12:00:00.000Z"),
    description: `Synthetic relational transaction ${id}`,
    amountCents: 100,
    direction: TransactionDirection.EXPENSE,
    dedupeKey,
  };
}

async function userBRelationalSnapshot() {
  const [bank, statementImport, transaction, category, rule] = await Promise.all([
    prisma.bankAccount.findUniqueOrThrow({ where: { id: ids.bankB } }),
    prisma.statementImport.findUniqueOrThrow({ where: { id: ids.importB } }),
    prisma.transaction.findUniqueOrThrow({ where: { id: ids.transactionB } }),
    prisma.category.findUniqueOrThrow({ where: { id: ids.categoryB } }),
    prisma.categoryRule.findUniqueOrThrow({ where: { id: ids.ruleB } }),
  ]);

  return { bank, statementImport, transaction, category, rule };
}

async function expectForeignKeyRejection(operation: () => Promise<unknown>) {
  let caught: unknown;

  try {
    await operation();
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  const prismaError = caught as Prisma.PrismaClientKnownRequestError;
  expect(prismaError.code).toBe("P2003");
  for (const privateValue of [
    ids.userB,
    ids.bankB,
    ids.importB,
    ids.transactionB,
    ids.categoryB,
    ids.ruleB,
    userBPrivateMarker,
  ]) {
    expect(prismaError.message).not.toContain(privateValue);
  }
}

beforeAll(async () => {
  await cleanupSyntheticFixtures();

  await prisma.user.createMany({
    data: [
      {
        id: ids.userA,
        name: "Synthetic Relational User A",
        email: "relational-user-a@example.test",
        passwordHash: "synthetic-password-hash-a",
      },
      {
        id: ids.userB,
        name: "Synthetic Relational User B",
        email: "relational-user-b@example.test",
        passwordHash: "synthetic-password-hash-b",
      },
    ],
  });

  await prisma.bankAccount.createMany({
    data: [
      { id: ids.bankA, userId: ids.userA, name: "Synthetic Bank A" },
      { id: ids.bankB, userId: ids.userB, name: userBPrivateMarker },
      {
        id: ids.noActionTransactionBank,
        userId: ids.userA,
        name: "Synthetic NO ACTION transaction bank",
      },
      {
        id: ids.noActionStatementImportBank,
        userId: ids.userA,
        name: "Synthetic NO ACTION statement import bank",
      },
    ],
  });

  await prisma.category.createMany({
    data: [
      categoryFixture({
        id: ids.parentA,
        userId: ids.userA,
        name: "Synthetic Parent A",
      }),
      categoryFixture({
        id: ids.childA,
        userId: ids.userA,
        parentId: ids.parentA,
        name: "Synthetic Child A",
      }),
      categoryFixture({ id: ids.categoryB, userId: ids.userB, name: userBPrivateMarker }),
      categoryFixture({
        id: ids.noActionParent,
        userId: ids.userA,
        name: "Synthetic NO ACTION Parent",
      }),
      categoryFixture({
        id: ids.noActionChild,
        userId: ids.userA,
        parentId: ids.noActionParent,
        name: "Synthetic NO ACTION Child",
      }),
      categoryFixture({
        id: ids.noActionTransactionCategory,
        userId: ids.userA,
        name: "Synthetic NO ACTION Transaction Category",
      }),
      categoryFixture({
        id: ids.cascadeCategory,
        userId: ids.userA,
        name: "Synthetic Cascade Category",
      }),
    ],
  });

  await prisma.statementImport.createMany({
    data: [
      {
        id: ids.importA,
        userId: ids.userA,
        bankAccountId: ids.bankA,
        format: StatementFormat.CSV,
      },
      {
        id: ids.importB,
        userId: ids.userB,
        bankAccountId: ids.bankB,
        format: StatementFormat.CSV,
      },
      {
        id: ids.importNull,
        userId: ids.userA,
        bankAccountId: null,
        format: StatementFormat.CSV,
      },
      {
        id: ids.noActionTransactionImport,
        userId: ids.userA,
        bankAccountId: null,
        format: StatementFormat.CSV,
      },
      {
        id: ids.noActionBankStatementImport,
        userId: ids.userA,
        bankAccountId: ids.noActionStatementImportBank,
        format: StatementFormat.CSV,
      },
    ],
  });

  await prisma.transaction.createMany({
    data: [
      {
        ...transactionData(
          ids.transactionA,
          ids.userA,
          "integration-relational-dedupe-a",
        ),
        bankAccountId: ids.bankA,
        statementImportId: ids.importA,
        categoryId: ids.childA,
      },
      {
        ...transactionData(
          ids.transactionB,
          ids.userB,
          "integration-relational-dedupe-b",
        ),
        bankAccountId: ids.bankB,
        statementImportId: ids.importB,
        categoryId: ids.categoryB,
        description: userBPrivateMarker,
      },
      {
        ...transactionData(
          ids.transactionNull,
          ids.userA,
          "integration-relational-dedupe-null",
        ),
        bankAccountId: null,
        statementImportId: null,
        categoryId: null,
      },
      {
        ...transactionData(
          ids.noActionCategoryTransaction,
          ids.userA,
          "integration-relational-dedupe-no-action-category",
        ),
        categoryId: ids.noActionTransactionCategory,
      },
      {
        ...transactionData(
          ids.noActionBankTransaction,
          ids.userA,
          "integration-relational-dedupe-no-action-bank",
        ),
        bankAccountId: ids.noActionTransactionBank,
      },
      {
        ...transactionData(
          ids.noActionImportTransaction,
          ids.userA,
          "integration-relational-dedupe-no-action-import",
        ),
        statementImportId: ids.noActionTransactionImport,
      },
    ],
  });

  await prisma.categoryRule.createMany({
    data: [
      {
        id: ids.ruleA,
        userId: ids.userA,
        categoryId: ids.childA,
        name: "Synthetic Rule A",
        matchText: "synthetic-a",
      },
      {
        id: ids.ruleB,
        userId: ids.userB,
        categoryId: ids.categoryB,
        name: userBPrivateMarker,
        matchText: "synthetic-b",
      },
      {
        id: ids.cascadeRule,
        userId: ids.userA,
        categoryId: ids.cascadeCategory,
        name: "Synthetic Cascade Rule",
        matchText: "synthetic-cascade",
      },
    ],
  });
});

afterAll(async () => {
  try {
    await cleanupSyntheticFixtures();
  } finally {
    await prisma.$disconnect();
  }
});

describe("tenant-scoped relational integrity", () => {
  it("persists all six same-user relations, null optionals, and independent tenants", async () => {
    await expect(
      prisma.category.findUniqueOrThrow({
        where: { id: ids.childA },
        select: { userId: true, parent: { select: { id: true, userId: true } } },
      }),
    ).resolves.toEqual({
      userId: ids.userA,
      parent: { id: ids.parentA, userId: ids.userA },
    });

    await expect(
      prisma.categoryRule.findUniqueOrThrow({
        where: { id: ids.ruleA },
        select: { userId: true, category: { select: { id: true, userId: true } } },
      }),
    ).resolves.toEqual({
      userId: ids.userA,
      category: { id: ids.childA, userId: ids.userA },
    });

    await expect(
      prisma.transaction.findUniqueOrThrow({
        where: { id: ids.transactionA },
        select: {
          userId: true,
          category: { select: { id: true, userId: true } },
          bankAccount: { select: { id: true, userId: true } },
          statementImport: { select: { id: true, userId: true } },
        },
      }),
    ).resolves.toEqual({
      userId: ids.userA,
      category: { id: ids.childA, userId: ids.userA },
      bankAccount: { id: ids.bankA, userId: ids.userA },
      statementImport: { id: ids.importA, userId: ids.userA },
    });

    await expect(
      prisma.statementImport.findUniqueOrThrow({
        where: { id: ids.importA },
        select: { userId: true, bankAccount: { select: { id: true, userId: true } } },
      }),
    ).resolves.toEqual({
      userId: ids.userA,
      bankAccount: { id: ids.bankA, userId: ids.userA },
    });

    await expect(
      prisma.transaction.findUniqueOrThrow({
        where: { id: ids.transactionNull },
        select: { categoryId: true, bankAccountId: true, statementImportId: true },
      }),
    ).resolves.toEqual({
      categoryId: null,
      bankAccountId: null,
      statementImportId: null,
    });

    await expect(
      prisma.statementImport.findUniqueOrThrow({
        where: { id: ids.importNull },
        select: { bankAccountId: true },
      }),
    ).resolves.toEqual({ bankAccountId: null });

    const tenantB = await userBRelationalSnapshot();
    expect(tenantB.transaction.userId).toBe(ids.userB);
    expect(tenantB.transaction.categoryId).toBe(ids.categoryB);
    expect(tenantB.statementImport.bankAccountId).toBe(ids.bankB);
  });

  const crossUserCases = [
    {
      relation: "Category.parentId",
      sourceId: ids.invalidParent,
      execute: () =>
        prisma.category.create({
          data: categoryFixture({
            id: ids.invalidParent,
            userId: ids.userA,
            parentId: ids.categoryB,
            name: "Synthetic Invalid Parent",
          }),
        }),
      count: () => prisma.category.count({ where: { id: ids.invalidParent } }),
    },
    {
      relation: "CategoryRule.categoryId",
      sourceId: ids.invalidRule,
      execute: () =>
        prisma.categoryRule.create({
          data: {
            id: ids.invalidRule,
            userId: ids.userA,
            categoryId: ids.categoryB,
            name: "Synthetic Invalid Rule",
            matchText: "synthetic-invalid-rule",
          },
        }),
      count: () => prisma.categoryRule.count({ where: { id: ids.invalidRule } }),
    },
    {
      relation: "Transaction.categoryId",
      sourceId: ids.invalidTransactionCategory,
      execute: () =>
        prisma.transaction.create({
          data: {
            ...transactionData(
              ids.invalidTransactionCategory,
              ids.userA,
              "integration-relational-dedupe-invalid-category",
            ),
            categoryId: ids.categoryB,
          },
        }),
      count: () =>
        prisma.transaction.count({ where: { id: ids.invalidTransactionCategory } }),
    },
    {
      relation: "Transaction.bankAccountId",
      sourceId: ids.invalidTransactionBank,
      execute: () =>
        prisma.transaction.create({
          data: {
            ...transactionData(
              ids.invalidTransactionBank,
              ids.userA,
              "integration-relational-dedupe-invalid-bank",
            ),
            bankAccountId: ids.bankB,
          },
        }),
      count: () => prisma.transaction.count({ where: { id: ids.invalidTransactionBank } }),
    },
    {
      relation: "Transaction.statementImportId",
      sourceId: ids.invalidTransactionImport,
      execute: () =>
        prisma.transaction.create({
          data: {
            ...transactionData(
              ids.invalidTransactionImport,
              ids.userA,
              "integration-relational-dedupe-invalid-import",
            ),
            statementImportId: ids.importB,
          },
        }),
      count: () =>
        prisma.transaction.count({ where: { id: ids.invalidTransactionImport } }),
    },
    {
      relation: "StatementImport.bankAccountId",
      sourceId: ids.invalidStatementImportBank,
      execute: () =>
        prisma.statementImport.create({
          data: {
            id: ids.invalidStatementImportBank,
            userId: ids.userA,
            bankAccountId: ids.bankB,
            format: StatementFormat.CSV,
          },
        }),
      count: () =>
        prisma.statementImport.count({ where: { id: ids.invalidStatementImportBank } }),
    },
  ];

  it.each(crossUserCases)(
    "rejects a cross-user $relation without partial persistence or disclosure",
    async ({ execute, count }) => {
      const tenantBBefore = await userBRelationalSnapshot();

      await expectForeignKeyRejection(execute);

      await expect(count()).resolves.toBe(0);
      await expect(userBRelationalSnapshot()).resolves.toEqual(tenantBBefore);
    },
  );

  it("declares five NO ACTION foreign keys and one tenant-scoped CASCADE", async () => {
    const actions = await prisma.$queryRaw<Array<{ name: string; deleteAction: string }>>`
      SELECT conname AS name, confdeltype::text AS "deleteAction"
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

    expect(actions).toEqual([
      { name: "CategoryRule_categoryId_userId_fkey", deleteAction: "c" },
      { name: "Category_parentId_userId_fkey", deleteAction: "a" },
      { name: "StatementImport_bankAccountId_userId_fkey", deleteAction: "a" },
      { name: "Transaction_bankAccountId_userId_fkey", deleteAction: "a" },
      { name: "Transaction_categoryId_userId_fkey", deleteAction: "a" },
      { name: "Transaction_statementImportId_userId_fkey", deleteAction: "a" },
    ]);
  });

  it("blocks direct deletion across each optional NO ACTION relation", async () => {
    const tenantBBefore = await userBRelationalSnapshot();

    await expectForeignKeyRejection(() =>
      prisma.category.delete({ where: { id: ids.noActionParent } }),
    );
    await expectForeignKeyRejection(() =>
      prisma.category.delete({ where: { id: ids.noActionTransactionCategory } }),
    );
    await expectForeignKeyRejection(() =>
      prisma.bankAccount.delete({ where: { id: ids.noActionTransactionBank } }),
    );
    await expectForeignKeyRejection(() =>
      prisma.statementImport.delete({ where: { id: ids.noActionTransactionImport } }),
    );
    await expectForeignKeyRejection(() =>
      prisma.bankAccount.delete({ where: { id: ids.noActionStatementImportBank } }),
    );

    await expect(
      prisma.category.count({
        where: { id: { in: [ids.noActionParent, ids.noActionTransactionCategory] } },
      }),
    ).resolves.toBe(2);
    await expect(
      prisma.bankAccount.count({
        where: {
          id: { in: [ids.noActionTransactionBank, ids.noActionStatementImportBank] },
        },
      }),
    ).resolves.toBe(2);
    await expect(
      prisma.statementImport.count({ where: { id: ids.noActionTransactionImport } }),
    ).resolves.toBe(1);
    await expect(userBRelationalSnapshot()).resolves.toEqual(tenantBBefore);
  });

  it("cascades category deletion only to a same-user rule", async () => {
    const tenantBBefore = await userBRelationalSnapshot();

    await prisma.category.delete({ where: { id: ids.cascadeCategory } });

    await expect(prisma.categoryRule.count({ where: { id: ids.cascadeRule } })).resolves.toBe(0);
    await expect(userBRelationalSnapshot()).resolves.toEqual(tenantBBefore);
  });

  it("rolls back earlier writes when a NO ACTION deletion fails", async () => {
    const originalName = "Synthetic NO ACTION Parent";

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.category.update({
          where: { id: ids.noActionParent },
          data: categoryNameFields("Synthetic name that must roll back"),
        });
        await tx.category.delete({ where: { id: ids.noActionParent } });
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      prisma.category.findUniqueOrThrow({
        where: { id: ids.noActionParent },
        select: { name: true },
      }),
    ).resolves.toEqual({ name: originalName });
  });

  it("deletes a complete tenant without affecting another user", async () => {
    const tenantBBefore = await userBRelationalSnapshot();

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: ids.userC,
          name: "Synthetic Relational User C",
          email: "relational-user-c@example.test",
          passwordHash: "synthetic-password-hash-c",
        },
      });
      await tx.bankAccount.create({
        data: { id: ids.bankC, userId: ids.userC, name: "Synthetic Bank C" },
      });
      await tx.category.create({
        data: categoryFixture({
          id: ids.parentC,
          userId: ids.userC,
          name: "Synthetic Parent C",
        }),
      });
      await tx.category.create({
        data: categoryFixture({
          id: ids.childC,
          userId: ids.userC,
          parentId: ids.parentC,
          name: "Synthetic Child C",
        }),
      });
      await tx.statementImport.create({
        data: {
          id: ids.importC,
          userId: ids.userC,
          bankAccountId: ids.bankC,
          format: StatementFormat.CSV,
        },
      });
      await tx.transaction.create({
        data: {
          ...transactionData(
            ids.transactionC,
            ids.userC,
            "integration-relational-dedupe-c",
          ),
          bankAccountId: ids.bankC,
          statementImportId: ids.importC,
          categoryId: ids.childC,
        },
      });
      await tx.categoryRule.create({
        data: {
          id: ids.ruleC,
          userId: ids.userC,
          categoryId: ids.childC,
          name: "Synthetic Rule C",
          matchText: "synthetic-c",
        },
      });
    });

    await prisma.user.delete({ where: { id: ids.userC } });

    const [userCount, bankCount, importCount, transactionCount, categoryCount, ruleCount] =
      await Promise.all([
        prisma.user.count({ where: { id: ids.userC } }),
        prisma.bankAccount.count({ where: { id: ids.bankC } }),
        prisma.statementImport.count({ where: { id: ids.importC } }),
        prisma.transaction.count({ where: { id: ids.transactionC } }),
        prisma.category.count({ where: { id: { in: [ids.parentC, ids.childC] } } }),
        prisma.categoryRule.count({ where: { id: ids.ruleC } }),
      ]);

    expect({ userCount, bankCount, importCount, transactionCount, categoryCount, ruleCount }).toEqual({
      userCount: 0,
      bankCount: 0,
      importCount: 0,
      transactionCount: 0,
      categoryCount: 0,
      ruleCount: 0,
    });
    await expect(userBRelationalSnapshot()).resolves.toEqual(tenantBBefore);
  });
});
