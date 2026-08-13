import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { listUserCategoriesForNavigation } from "@/lib/categories";
import {
  listFilteredUserTransactions,
  parseTransactionFilters,
  type TransactionFilters,
} from "@/lib/transactions";
import { categoryFixture } from "@/tests/helpers/category-fixture";

const prisma = new PrismaClient();
const userAId = "integration-filter-navigation-user-a";
const userBId = "integration-filter-navigation-user-b";
const userIds = [userAId, userBId];
const rootAId = "integration-filter-navigation-root-a";
const childAId = "integration-filter-navigation-child-a";
const otherAId = "integration-filter-navigation-other-a";
const rootBId = "integration-filter-navigation-root-b";
const sharedDescriptionHash = "a".repeat(64);
const paginationDescriptionHash = "b".repeat(64);
const foreignOnlyDescriptionHash = "c".repeat(64);
const ownRootTransactionId = "integration-filter-navigation-transaction-root-a";
const ownChildTransactionId = "integration-filter-navigation-transaction-child-a";
const foreignTransactionId = "integration-filter-navigation-transaction-root-b";
const missingTransactionId = "integration-filter-navigation-transaction-missing";
const currentNow = new Date("2026-08-02T18:00:00.000Z");

function transactionFilters(query: string): TransactionFilters {
  const parsed = parseTransactionFilters(Object.fromEntries(new URLSearchParams(query)));

  if (!parsed.ok) throw new Error(`Filtro sintetico invalido: ${parsed.reason}`);
  return parsed.filters;
}

async function queryUserA(query: string) {
  return listFilteredUserTransactions({
    userId: userAId,
    filters: transactionFilters(query),
    now: currentNow,
  });
}

async function removeSyntheticFixtures() {
  await prisma.transaction.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.category.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function userBControlSnapshot() {
  return Promise.all([
    prisma.transaction.findMany({
      where: { userId: userBId },
      select: {
        id: true,
        userId: true,
        categoryId: true,
        occurredAt: true,
        normalizedDescription: true,
        descriptionHash: true,
        amountCents: true,
        direction: true,
        categorizationSource: true,
        dedupeKey: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.category.findMany({
      where: { userId: userBId },
      select: { id: true, userId: true, parentId: true, name: true, comparisonKey: true },
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
        name: "Synthetic Filter Navigation User A",
        email: "filter-navigation-a@example.test",
        passwordHash: "synthetic-password-hash-a",
      },
      {
        id: userBId,
        name: "Synthetic Filter Navigation User B",
        email: "filter-navigation-b@example.test",
        passwordHash: "synthetic-password-hash-b",
      },
    ],
  });
  await prisma.category.createMany({
    data: [
      categoryFixture({ id: rootAId, userId: userAId, name: "Synthetic Food A" }),
      categoryFixture({ id: otherAId, userId: userAId, name: "Synthetic Paging A" }),
      categoryFixture({ id: rootBId, userId: userBId, name: "Synthetic Private Food B" }),
    ],
  });
  await prisma.category.create({
    data: categoryFixture({
      id: childAId,
      userId: userAId,
      parentId: rootAId,
      name: "Synthetic Market A",
    }),
  });

  await prisma.transaction.createMany({
    data: [
      {
        id: ownRootTransactionId,
        userId: userAId,
        categoryId: rootAId,
        occurredAt: new Date("2026-08-01T10:00:00.000Z"),
        description: "Synthetic owned root expense",
        normalizedDescription: "Synthetic Shared Merchant",
        descriptionHash: sharedDescriptionHash,
        amountCents: -100,
        direction: "EXPENSE",
        categorizationSource: "USER_MANUAL",
        dedupeKey: "integration-filter-navigation-root-a",
      },
      {
        id: ownChildTransactionId,
        userId: userAId,
        categoryId: childAId,
        occurredAt: new Date("2026-08-01T11:00:00.000Z"),
        description: "Synthetic owned child expense",
        normalizedDescription: "Synthetic Shared Merchant",
        descriptionHash: sharedDescriptionHash,
        amountCents: 200,
        direction: "EXPENSE",
        categorizationSource: "USER_MANUAL",
        dedupeKey: "integration-filter-navigation-child-a",
      },
      {
        id: "integration-filter-navigation-uncategorized-a",
        userId: userAId,
        occurredAt: new Date("2026-08-02T00:00:00.000Z"),
        description: "Synthetic uncategorized expense",
        normalizedDescription: null,
        descriptionHash: null,
        amountCents: -300,
        direction: "EXPENSE",
        dedupeKey: "integration-filter-navigation-uncategorized-a",
      },
      {
        id: "integration-filter-navigation-income-a",
        userId: userAId,
        occurredAt: new Date("2026-08-02T10:00:00.000Z"),
        description: "Synthetic contradictory income",
        amountCents: -500,
        direction: "INCOME",
        dedupeKey: "integration-filter-navigation-income-a",
      },
      {
        id: "integration-filter-navigation-transfer-a",
        userId: userAId,
        occurredAt: new Date("2026-08-02T11:00:00.000Z"),
        description: "Synthetic contradictory transfer",
        amountCents: -600,
        direction: "TRANSFER",
        dedupeKey: "integration-filter-navigation-transfer-a",
      },
      {
        id: "integration-filter-navigation-reversal-a",
        userId: userAId,
        occurredAt: new Date("2026-08-02T12:00:00.000Z"),
        description: "Synthetic contradictory reversal",
        amountCents: 700,
        direction: "REVERSAL",
        dedupeKey: "integration-filter-navigation-reversal-a",
      },
      {
        id: "integration-filter-navigation-before-day-a",
        userId: userAId,
        categoryId: otherAId,
        occurredAt: new Date("2026-08-01T23:59:59.999Z"),
        description: "Synthetic before isolated day",
        amountCents: 800,
        direction: "EXPENSE",
        dedupeKey: "integration-filter-navigation-before-day-a",
      },
      {
        id: "integration-filter-navigation-exclusive-day-a",
        userId: userAId,
        categoryId: otherAId,
        occurredAt: new Date("2026-08-03T00:00:00.000Z"),
        description: "Synthetic exclusive isolated day",
        amountCents: 900,
        direction: "EXPENSE",
        dedupeKey: "integration-filter-navigation-exclusive-day-a",
      },
      {
        id: foreignTransactionId,
        userId: userBId,
        categoryId: rootBId,
        occurredAt: new Date("2026-08-01T10:30:00.000Z"),
        description: "Synthetic private shared-hash expense B",
        normalizedDescription: "Synthetic Private Merchant B",
        descriptionHash: sharedDescriptionHash,
        amountCents: 900_000,
        direction: "EXPENSE",
        categorizationSource: "USER_MANUAL",
        dedupeKey: "integration-filter-navigation-root-b",
      },
      {
        id: "integration-filter-navigation-private-hash-b",
        userId: userBId,
        categoryId: rootBId,
        occurredAt: new Date("2026-08-02T10:30:00.000Z"),
        description: "Synthetic private only-hash expense B",
        normalizedDescription: "Synthetic Foreign Only Merchant B",
        descriptionHash: foreignOnlyDescriptionHash,
        amountCents: 800_000,
        direction: "EXPENSE",
        dedupeKey: "integration-filter-navigation-private-hash-b",
      },
      ...Array.from({ length: 27 }, (_, index) => {
        const suffix = String(index).padStart(2, "0");

        return {
          id: `integration-filter-navigation-page-a-${suffix}`,
          userId: userAId,
          categoryId: otherAId,
          occurredAt: new Date("2026-08-05T12:00:00.000Z"),
          description: `Synthetic paging expense ${suffix}`,
          normalizedDescription: "Synthetic Paging Merchant",
          descriptionHash: paginationDescriptionHash,
          amountCents: 1_000 + index,
          direction: "EXPENSE" as const,
          dedupeKey: `integration-filter-navigation-page-a-${suffix}`,
        };
      }),
      {
        id: "integration-filter-navigation-page-b-private",
        userId: userBId,
        categoryId: rootBId,
        occurredAt: new Date("2026-08-05T12:00:00.000Z"),
        description: "Synthetic private paging expense B",
        normalizedDescription: "Synthetic Paging Merchant",
        descriptionHash: paginationDescriptionHash,
        amountCents: 700_000,
        direction: "EXPENSE",
        dedupeKey: "integration-filter-navigation-page-b-private",
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

describe("transaction filter authorization and navigation", () => {
  it("rolls a root category up through its child while a child remains specific", async () => {
    const root = await queryUserA(`period=current-month&direction=expense&categoryId=${rootAId}`);
    const child = await queryUserA(`period=current-month&direction=expense&categoryId=${childAId}`);

    expect(root.ok).toBe(true);
    expect(child.ok).toBe(true);
    if (!root.ok || !child.ok) return;

    expect(root.data.transactions.map((transaction) => transaction.id).sort()).toEqual(
      [ownRootTransactionId, ownChildTransactionId].sort(),
    );
    expect(root.data.pagination.totalItems).toBe(2);
    expect(child.data.transactions.map((transaction) => transaction.id)).toEqual([ownChildTransactionId]);
    expect(child.data.pagination.totalItems).toBe(1);
  });

  it("returns indistinguishable failures for foreign and missing category or transaction IDs", async () => {
    const foreignCategory = await queryUserA(`categoryId=${rootBId}`);
    const missingCategory = await queryUserA("categoryId=integration-filter-navigation-category-missing");
    const foreignTransaction = await queryUserA(`transactionId=${foreignTransactionId}`);
    const missingTransaction = await queryUserA(`transactionId=${missingTransactionId}`);

    expect(foreignCategory).toEqual({ ok: false, reason: "RESOURCE_NOT_FOUND" });
    expect(missingCategory).toEqual(foreignCategory);
    expect(foreignTransaction).toEqual({ ok: false, reason: "RESOURCE_NOT_FOUND" });
    expect(missingTransaction).toEqual(foreignTransaction);
  });

  it("filters categorization state without writing or changing USER_MANUAL", async () => {
    const userBBefore = await userBControlSnapshot();
    const manualBefore = await prisma.transaction.findMany({
      where: { id: { in: [ownRootTransactionId, ownChildTransactionId] }, userId: userAId },
      select: { id: true, categoryId: true, categorizationSource: true, updatedAt: true },
      orderBy: { id: "asc" },
    });

    const uncategorized = await queryUserA("date=2026-08-02&direction=expense&filter=uncategorized");
    const categorized = await queryUserA("date=2026-08-01&direction=expense&filter=categorized");

    expect(uncategorized.ok).toBe(true);
    expect(categorized.ok).toBe(true);
    if (!uncategorized.ok || !categorized.ok) return;

    expect(uncategorized.data.transactions.map((transaction) => transaction.id)).toEqual([
      "integration-filter-navigation-uncategorized-a",
    ]);
    expect(categorized.data.transactions.map((transaction) => transaction.id).sort()).toEqual(
      [
        ownRootTransactionId,
        ownChildTransactionId,
        "integration-filter-navigation-before-day-a",
      ].sort(),
    );
    await expect(
      prisma.transaction.findMany({
        where: { id: { in: [ownRootTransactionId, ownChildTransactionId] }, userId: userAId },
        select: { id: true, categoryId: true, categorizationSource: true, updatedAt: true },
        orderBy: { id: "asc" },
      }),
    ).resolves.toEqual(manualBefore);
    await expect(userBControlSnapshot()).resolves.toEqual(userBBefore);
  });

  it.each([
    ["income", "integration-filter-navigation-income-a"],
    ["expense", "integration-filter-navigation-uncategorized-a"],
    ["transfer", "integration-filter-navigation-transfer-a"],
    ["reversal", "integration-filter-navigation-reversal-a"],
  ])("uses enum direction for %s even when the amount sign contradicts it", async (direction, expectedId) => {
    const result = await queryUserA(`date=2026-08-02&direction=${direction}`);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.transactions.map((transaction) => transaction.id)).toEqual([expectedId]);
  });

  it("uses UTC gte/lt boundaries for an isolated date and the current period", async () => {
    const isolated = await queryUserA("date=2026-08-02&direction=expense");
    const currentPeriod = await queryUserA("period=current-month&direction=expense");

    expect(isolated.ok).toBe(true);
    expect(currentPeriod.ok).toBe(true);
    if (!isolated.ok || !currentPeriod.ok) return;

    expect(isolated.data.transactions.map((transaction) => transaction.id)).toEqual([
      "integration-filter-navigation-uncategorized-a",
    ]);
    expect(currentPeriod.data.transactions.map((transaction) => transaction.id)).not.toContain(
      "integration-filter-navigation-exclusive-day-a",
    );
    expect(currentPeriod.data.transactions.map((transaction) => transaction.id)).toContain(
      "integration-filter-navigation-before-day-a",
    );
  });

  it("isolates shared and foreign-only description hashes without grouping null descriptions", async () => {
    const shared = await queryUserA(`descriptionHash=${sharedDescriptionHash}&direction=expense`);
    const foreignOnly = await queryUserA(`descriptionHash=${foreignOnlyDescriptionHash}&direction=expense`);

    expect(shared.ok).toBe(true);
    expect(foreignOnly.ok).toBe(true);
    if (!shared.ok || !foreignOnly.ok) return;

    expect(shared.data.transactions.map((transaction) => transaction.id).sort()).toEqual(
      [ownRootTransactionId, ownChildTransactionId].sort(),
    );
    expect(JSON.stringify(shared.data)).not.toContain(foreignTransactionId);
    expect(JSON.stringify(shared.data)).not.toContain("900000");
    expect(shared.data.activeFilters).toContainEqual(
      expect.objectContaining({ key: "descriptionHash", value: "Synthetic Shared Merchant" }),
    );
    expect(foreignOnly.data.transactions).toEqual([]);
    expect(foreignOnly.data.pagination.totalItems).toBe(0);
  });

  it("paginates in deterministic occurredAt/id order without repeats, skips, or foreign totals", async () => {
    const first = await queryUserA(`descriptionHash=${paginationDescriptionHash}&direction=expense&page=1`);
    const second = await queryUserA(`descriptionHash=${paginationDescriptionHash}&direction=expense&page=2`);
    const beyond = await queryUserA(`descriptionHash=${paginationDescriptionHash}&direction=expense&page=3`);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    const expected = Array.from(
      { length: 27 },
      (_, index) => `integration-filter-navigation-page-a-${String(26 - index).padStart(2, "0")}`,
    );
    const firstIds = first.data.transactions.map((transaction) => transaction.id);
    const secondIds = second.data.transactions.map((transaction) => transaction.id);

    expect(first.data.pagination).toEqual({
      page: 1,
      pageSize: 25,
      totalItems: 27,
      totalPages: 2,
      hasPreviousPage: false,
      hasNextPage: true,
    });
    expect(second.data.pagination).toEqual({
      page: 2,
      pageSize: 25,
      totalItems: 27,
      totalPages: 2,
      hasPreviousPage: true,
      hasNextPage: false,
    });
    expect([...firstIds, ...secondIds]).toEqual(expected);
    expect(new Set([...firstIds, ...secondIds]).size).toBe(27);
    expect(JSON.stringify([...first.data.transactions, ...second.data.transactions])).not.toContain(
      "integration-filter-navigation-page-b-private",
    );
    expect(beyond).toEqual({ ok: false, reason: "INVALID_PAGE" });
  });

  it("returns category navigation counts scoped to the user and rolled up only for roots", async () => {
    const result = await listUserCategoriesForNavigation(userAId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const root = result.data.categories.find((category) => category.id === rootAId);
    const child = root?.children.find((category) => category.id === childAId);
    const serialized = JSON.stringify(result.data);

    expect(root).toEqual(expect.objectContaining({ directExpenseCount: 1, totalExpenseCount: 2 }));
    expect(child).toEqual(expect.objectContaining({ directExpenseCount: 1, totalExpenseCount: 1 }));
    expect(result.data.uncategorizedExpenseCount).toBe(1);
    expect(serialized).not.toContain(rootBId);
    expect(serialized).not.toContain("Synthetic Private Food B");
  });
});
