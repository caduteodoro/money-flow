import {
  CategorizationSource,
  PrismaClient,
  TransactionDirection,
} from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const authenticatedUser = vi.hoisted(() => ({
  current: {
    id: "integration-manual-preservation-user",
    name: "Synthetic Manual Preservation User",
    email: "manual-preservation-user@example.test",
  },
}));

vi.mock("@/lib/auth/current-user", () => ({
  requireCurrentUser: vi.fn(async () => authenticatedUser.current),
}));

import { applyCategoryRulesAction } from "@/app/categories/rule-actions";
import { applyCategoryRulesToUncategorizedTransactions } from "@/lib/category-rules";
import { categoryFixture } from "@/tests/helpers/category-fixture";

const prisma = new PrismaClient();
const userId = authenticatedUser.current.id;
const automaticCategoryId = "integration-manual-preservation-category-automatic";
const ruleId = "integration-manual-preservation-rule";
const protectedTransactionId = "integration-manual-preservation-transaction-protected";
const eligibleTransactionId = "integration-manual-preservation-transaction-eligible";
const matchingDescription = "synthetic adversarial automatic match";

async function removeSyntheticFixtures() {
  await prisma.transaction.deleteMany({
    where: { id: { in: [protectedTransactionId, eligibleTransactionId] } },
  });
  await prisma.categoryRule.deleteMany({ where: { id: ruleId } });
  await prisma.category.deleteMany({ where: { id: automaticCategoryId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

beforeAll(async () => {
  await removeSyntheticFixtures();
  await prisma.user.create({
    data: {
      id: userId,
      name: authenticatedUser.current.name,
      email: authenticatedUser.current.email,
      passwordHash: "synthetic-password-hash",
    },
  });
  await prisma.category.create({
    data: categoryFixture({
      id: automaticCategoryId,
      userId,
      name: "Synthetic Automatic Category B",
    }),
  });
  await prisma.categoryRule.create({
    data: {
      id: ruleId,
      userId,
      categoryId: automaticCategoryId,
      name: "Synthetic High Priority Rule",
      matchText: matchingDescription,
      isActive: true,
      priority: 1,
    },
  });
  await prisma.transaction.createMany({
    data: [
      {
        id: protectedTransactionId,
        userId,
        categoryId: null,
        occurredAt: new Date("2026-02-01T12:00:00.000Z"),
        description: "Synthetic protected manual transaction",
        normalizedDescription: matchingDescription,
        amountCents: 11111,
        direction: TransactionDirection.EXPENSE,
        categorizationSource: CategorizationSource.USER_MANUAL,
        dedupeKey: "integration-manual-preservation-protected",
        rawPayload: { syntheticMarker: "protected-record-must-remain-identical" },
      },
      {
        id: eligibleTransactionId,
        userId,
        categoryId: null,
        occurredAt: new Date("2026-02-02T12:00:00.000Z"),
        description: "Synthetic eligible automatic transaction",
        normalizedDescription: matchingDescription,
        amountCents: 22222,
        direction: TransactionDirection.EXPENSE,
        categorizationSource: CategorizationSource.IMPORTED,
        dedupeKey: "integration-manual-preservation-eligible",
      },
    ],
  });
});

afterAll(async () => {
  try {
    await removeSyntheticFixtures();
  } finally {
    await prisma.$disconnect();
  }
});

describe("manual categorization preservation", () => {
  it("never overwrites USER_MANUAL while automatic rules still categorize eligible transactions", async () => {
    const protectedBefore = await prisma.transaction.findUniqueOrThrow({
      where: { id: protectedTransactionId },
    });
    const ruleBefore = await prisma.categoryRule.findUniqueOrThrow({ where: { id: ruleId } });

    const serviceResult = await applyCategoryRulesToUncategorizedTransactions(userId);

    expect(serviceResult).toEqual({
      ok: true,
      data: {
        processedCount: 1,
        categorizedCount: 1,
        unmatchedCount: 0,
        activeRuleCount: 1,
      },
    });
    await expect(
      prisma.transaction.findUniqueOrThrow({ where: { id: protectedTransactionId } }),
    ).resolves.toEqual(protectedBefore);
    await expect(
      prisma.transaction.findUniqueOrThrow({
        where: { id: eligibleTransactionId },
        select: { userId: true, categoryId: true, categorizationSource: true },
      }),
    ).resolves.toEqual({
      userId,
      categoryId: automaticCategoryId,
      categorizationSource: CategorizationSource.SYSTEM_RULE,
    });

    await prisma.transaction.update({
      where: { id: eligibleTransactionId },
      data: { categoryId: null, categorizationSource: CategorizationSource.IMPORTED },
    });

    await expect(applyCategoryRulesAction({ status: "idle" })).rejects.toThrow(
      "static generation store missing",
    );

    await expect(
      prisma.transaction.findUniqueOrThrow({ where: { id: protectedTransactionId } }),
    ).resolves.toEqual(protectedBefore);
    await expect(
      prisma.transaction.findUniqueOrThrow({
        where: { id: eligibleTransactionId },
        select: { userId: true, categoryId: true, categorizationSource: true },
      }),
    ).resolves.toEqual({
      userId,
      categoryId: automaticCategoryId,
      categorizationSource: CategorizationSource.SYSTEM_RULE,
    });
    await expect(
      prisma.categoryRule.findUniqueOrThrow({ where: { id: ruleId } }),
    ).resolves.toEqual(ruleBefore);
    await expect(
      prisma.transaction.count({
        where: {
          id: protectedTransactionId,
          userId,
          categoryId: automaticCategoryId,
        },
      }),
    ).resolves.toBe(0);
  });
});
