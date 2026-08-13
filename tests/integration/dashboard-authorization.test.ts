import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDashboardSummary } from "@/lib/dashboard/dashboard-service";
import { categoryFixture } from "@/tests/helpers/category-fixture";

const prisma = new PrismaClient();
const userAId = "integration-dashboard-user-a";
const userBId = "integration-dashboard-user-b";
const userWithoutDataId = "integration-dashboard-user-empty";
const userIds = [userAId, userBId, userWithoutDataId];
const rootCategoryAId = "integration-dashboard-root-a";
const childCategoryAId = "integration-dashboard-child-a";
const rootCategoryBId = "integration-dashboard-root-b-private";
const userBPrivateDescription = "SYNTHETIC-DASHBOARD-B-PRIVATE-7A3E";
const userBPrivateNormalizedDescription = "SYNTHETIC NORMALIZED B PRIVATE 4D21";
const currentNow = new Date("2026-08-12T15:00:00.000Z");

async function removeSyntheticFixtures() {
  await prisma.transaction.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.category.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function userBFinancialSnapshot() {
  return Promise.all([
    prisma.transaction.findMany({
      where: { userId: userBId },
      select: {
        id: true,
        userId: true,
        categoryId: true,
        categorizationSource: true,
        occurredAt: true,
        description: true,
        normalizedDescription: true,
        descriptionHash: true,
        amountCents: true,
        direction: true,
        dedupeKey: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.category.findMany({
      where: { userId: userBId },
      select: {
        id: true,
        userId: true,
        parentId: true,
        name: true,
        comparisonKey: true,
      },
      orderBy: { id: "asc" },
    }),
  ]);
}

beforeAll(async () => {
  await removeSyntheticFixtures();
  await prisma.user.createMany({
    data: [
      {
        id: userAId,
        name: "Synthetic Dashboard User A",
        email: "dashboard-user-a@example.test",
        passwordHash: "synthetic-password-hash-a",
      },
      {
        id: userBId,
        name: "Synthetic Dashboard User B",
        email: "dashboard-user-b@example.test",
        passwordHash: "synthetic-password-hash-b",
      },
      {
        id: userWithoutDataId,
        name: "Synthetic Dashboard Empty User",
        email: "dashboard-user-empty@example.test",
        passwordHash: "synthetic-password-hash-empty",
      },
    ],
  });
  await prisma.category.createMany({
    data: [
      categoryFixture({ id: rootCategoryAId, userId: userAId, name: "Synthetic Alimentacao A" }),
      categoryFixture({ id: rootCategoryBId, userId: userBId, name: "SYNTHETIC PRIVATE CATEGORY B 8C5F" }),
    ],
  });
  await prisma.category.create({
    data: categoryFixture({
      id: childCategoryAId,
      userId: userAId,
      parentId: rootCategoryAId,
      name: "Synthetic Mercado A",
    }),
  });
  await prisma.transaction.createMany({
    data: [
      {
        id: "integration-dashboard-a-previous-income",
        userId: userAId,
        occurredAt: new Date("2026-07-21T10:00:00.000Z"),
        description: "Synthetic previous income A",
        normalizedDescription: "Synthetic Previous Income A",
        descriptionHash: "dashboard-a-previous-income-hash",
        amountCents: -1_000,
        direction: "INCOME",
        dedupeKey: "integration-dashboard-a-previous-income",
      },
      {
        id: "integration-dashboard-a-previous-expense",
        userId: userAId,
        occurredAt: new Date("2026-07-22T10:00:00.000Z"),
        description: "Synthetic previous expense A",
        normalizedDescription: "Synthetic Previous Expense A",
        descriptionHash: "dashboard-a-previous-expense-hash",
        amountCents: -200,
        direction: "EXPENSE",
        dedupeKey: "integration-dashboard-a-previous-expense",
      },
      {
        id: "integration-dashboard-a-previous-transfer",
        userId: userAId,
        occurredAt: new Date("2026-07-23T10:00:00.000Z"),
        description: "Synthetic previous transfer A",
        amountCents: 99_999,
        direction: "TRANSFER",
        dedupeKey: "integration-dashboard-a-previous-transfer",
      },
      {
        id: "integration-dashboard-a-current-income",
        userId: userAId,
        occurredAt: new Date("2026-08-01T00:00:00.000Z"),
        description: "Synthetic current income A",
        normalizedDescription: "Synthetic Current Income A",
        descriptionHash: "dashboard-a-current-income-hash",
        amountCents: 2_000,
        direction: "INCOME",
        dedupeKey: "integration-dashboard-a-current-income",
      },
      {
        id: "integration-dashboard-a-current-child-expense",
        userId: userAId,
        categoryId: childCategoryAId,
        occurredAt: new Date("2026-08-02T10:00:00.000Z"),
        description: "Synthetic shared expense A",
        normalizedDescription: "Synthetic Shared Expense",
        descriptionHash: "dashboard-shared-description-hash",
        amountCents: -500,
        direction: "EXPENSE",
        categorizationSource: "USER_MANUAL",
        dedupeKey: "integration-dashboard-a-current-child-expense",
      },
      {
        id: "integration-dashboard-a-current-root-expense",
        userId: userAId,
        categoryId: rootCategoryAId,
        occurredAt: new Date("2026-08-03T10:00:00.000Z"),
        description: "Synthetic root expense A",
        normalizedDescription: "Synthetic Root Expense A",
        descriptionHash: "dashboard-a-root-expense-hash",
        amountCents: 300,
        direction: "EXPENSE",
        dedupeKey: "integration-dashboard-a-current-root-expense",
      },
      {
        id: "integration-dashboard-a-current-uncategorized",
        userId: userAId,
        occurredAt: new Date("2026-08-04T10:00:00.000Z"),
        description: "Synthetic uncategorized expense A",
        amountCents: 200,
        direction: "EXPENSE",
        dedupeKey: "integration-dashboard-a-current-uncategorized",
      },
      {
        id: "integration-dashboard-a-current-transfer",
        userId: userAId,
        occurredAt: new Date("2026-08-05T10:00:00.000Z"),
        description: "Synthetic current transfer A",
        amountCents: 90_000,
        direction: "TRANSFER",
        dedupeKey: "integration-dashboard-a-current-transfer",
      },
      {
        id: "integration-dashboard-a-current-reversal",
        userId: userAId,
        occurredAt: new Date("2026-08-06T10:00:00.000Z"),
        description: "Synthetic current reversal A",
        amountCents: -80_000,
        direction: "REVERSAL",
        dedupeKey: "integration-dashboard-a-current-reversal",
      },
      {
        id: "integration-dashboard-a-exclusive-boundary",
        userId: userAId,
        occurredAt: new Date("2026-08-13T00:00:00.000Z"),
        description: "Synthetic exclusive boundary A",
        amountCents: 70_000,
        direction: "EXPENSE",
        dedupeKey: "integration-dashboard-a-exclusive-boundary",
      },
      {
        id: "integration-dashboard-b-current-expense-shared",
        userId: userBId,
        categoryId: rootCategoryBId,
        occurredAt: new Date("2026-08-02T10:00:00.000Z"),
        description: userBPrivateDescription,
        normalizedDescription: "Synthetic Shared Expense",
        descriptionHash: "dashboard-shared-description-hash",
        amountCents: 900_000,
        direction: "EXPENSE",
        categorizationSource: "USER_MANUAL",
        dedupeKey: "integration-dashboard-b-current-expense-shared",
      },
      {
        id: "integration-dashboard-b-current-expense-private",
        userId: userBId,
        categoryId: rootCategoryBId,
        occurredAt: new Date("2026-08-04T10:00:00.000Z"),
        description: "Synthetic second private expense B",
        normalizedDescription: userBPrivateNormalizedDescription,
        descriptionHash: "dashboard-b-private-description-hash",
        amountCents: 800_000,
        direction: "EXPENSE",
        dedupeKey: "integration-dashboard-b-current-expense-private",
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

describe("dashboard analytics authorization and reconciliation", () => {
  it("isolates current and previous analytics by user while preserving foreign records", async () => {
    const userBBefore = await userBFinancialSnapshot();

    const summary = await getDashboardSummary({
      userId: userAId,
      dateFilter: "current-month",
      now: currentNow,
    });
    const serialized = JSON.stringify(summary);

    expect(summary.period).toEqual({
      filter: "current-month",
      startInclusive: new Date("2026-08-01T00:00:00.000Z"),
      endExclusive: new Date("2026-08-13T00:00:00.000Z"),
      dayCount: 12,
    });
    expect(summary.comparisonPeriod).toEqual({
      filter: "current-month",
      startInclusive: new Date("2026-07-20T00:00:00.000Z"),
      endExclusive: new Date("2026-08-01T00:00:00.000Z"),
      dayCount: 12,
    });
    expect(summary.kpis).toEqual({
      totalIncomeCents: 2_000,
      totalExpenseCents: 1_000,
      periodResultCents: 1_000,
      averageExpenseCents: 333,
      largestExpenseCents: 500,
      includedTransactionCount: 4,
    });
    expect(summary.comparisons.totalIncomeCents).toEqual({
      currentValue: 2_000,
      previousValue: 1_000,
      absoluteChange: 1_000,
      percentageChange: 100,
      comparisonStatus: "INCREASE",
    });
    expect(summary.comparisons.totalExpenseCents.percentageChange).toBe(400);
    expect(summary.comparisons.periodResultCents.percentageChange).toBe(25);
    expect(summary.comparisons.averageExpenseCents).toEqual(expect.objectContaining({
      currentValue: 333,
      previousValue: 200,
      absoluteChange: 133,
      comparisonStatus: "INCREASE",
    }));
    expect(summary.categories.rootCategories).toEqual([
      expect.objectContaining({
        rootCategoryId: rootCategoryAId,
        amountCents: 800,
        transactionCount: 2,
      }),
    ]);
    expect(summary.categories.uncategorized).toEqual(expect.objectContaining({
      amountCents: 200,
      transactionCount: 1,
    }));
    expect(summary.categories.coverage).toEqual(expect.objectContaining({
      totalExpenseCents: 1_000,
      totalExpenseCount: 3,
      categorizedExpenseCents: 800,
      categorizedExpenseCount: 2,
      amountCoveragePercentage: 80,
    }));
    expect(summary.categories.coverage.countCoveragePercentage).toBeCloseTo(200 / 3);
    expect(summary.offenders.topCategory?.rootCategoryId).toBe(rootCategoryAId);
    expect(summary.offenders.largestExpenses[0]).toEqual(expect.objectContaining({
      id: "integration-dashboard-a-current-child-expense",
      amountCents: 500,
    }));
    expect(summary.charts.cashflow.at(-1)?.cumulativeResultCents).toBe(summary.kpis.periodResultCents);
    expect(summary.charts.cashflow.reduce((total, point) => total + point.expenseCents, 0)).toBe(
      summary.kpis.totalExpenseCents,
    );
    expect(summary.categories.rootCategories.reduce((total, category) => total + category.amountCents, 0) +
      summary.categories.uncategorized.amountCents).toBe(summary.kpis.totalExpenseCents);
    expect(serialized).not.toContain(rootCategoryBId);
    expect(serialized).not.toContain(userBPrivateDescription);
    expect(serialized).not.toContain(userBPrivateNormalizedDescription);
    expect(serialized).not.toContain("integration-dashboard-b-current-expense");
    expect(serialized).not.toContain("900000");
    expect(serialized).not.toContain("800000");
    expect(serialized).not.toContain("integration-dashboard-a-exclusive-boundary");
    await expect(userBFinancialSnapshot()).resolves.toEqual(userBBefore);
    await expect(
      prisma.transaction.findFirstOrThrow({
        where: {
          id: "integration-dashboard-a-current-child-expense",
          userId: userAId,
        },
        select: { categorizationSource: true, categoryId: true },
      }),
    ).resolves.toEqual({ categorizationSource: "USER_MANUAL", categoryId: childCategoryAId });
  });

  it("returns an explicit no-data analytical contract for a user without transactions", async () => {
    const summary = await getDashboardSummary({
      userId: userWithoutDataId,
      dateFilter: "imported-period",
      now: currentNow,
    });

    expect(summary.hasImportedTransactions).toBe(false);
    expect(summary.period).toEqual({
      filter: "imported-period",
      startInclusive: null,
      endExclusive: null,
      dayCount: 0,
    });
    expect(summary.comparisonPeriod).toBeNull();
    expect(summary.kpis).toEqual({
      totalIncomeCents: 0,
      totalExpenseCents: 0,
      periodResultCents: 0,
      averageExpenseCents: null,
      largestExpenseCents: null,
      includedTransactionCount: 0,
    });
    expect(summary.comparisons.totalIncomeCents.comparisonStatus).toBe("NO_BASIS");
    expect(summary.comparisons.totalIncomeCents.percentageChange).toBeNull();
    expect(summary.categories.coverage.amountCoveragePercentage).toBeNull();
    expect(summary.categories.coverage.countCoveragePercentage).toBeNull();
    expect(summary.offenders.largestExpenses).toEqual([]);
    expect(summary.charts.cashflow).toEqual([]);
  });
});
