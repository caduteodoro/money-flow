import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const authenticatedUser = vi.hoisted(() => ({
  current: {
    id: "integration-transaction-auth-user-a",
    name: "Synthetic Transaction User A",
    email: "transaction-auth-user-a@example.test",
  },
}));

vi.mock("@/lib/auth/current-user", () => ({
  requireCurrentUser: vi.fn(async () => authenticatedUser.current),
}));

import { assignTransactionCategoryAction } from "@/app/transactions/actions";
import { listFilteredUserTransactions, parseTransactionFilters } from "@/lib/transactions";
import { categoryFixture } from "@/tests/helpers/category-fixture";

const prisma = new PrismaClient();
const userAId = authenticatedUser.current.id;
const userBId = "integration-transaction-auth-user-b";
const categoryAId = "integration-transaction-auth-category-a";
const categoryBId = "integration-transaction-auth-category-b";
const transactionAId = "integration-transaction-auth-transaction-a";
const transactionBId = "integration-transaction-auth-transaction-b";
const missingTransactionId = "integration-transaction-auth-transaction-missing";
const userBPrivateDescription = "SYNTHETIC-B-PRIVATE-MARKER-2C7A";

async function removeSyntheticFixtures() {
  await prisma.transaction.deleteMany({ where: { id: { in: [transactionAId, transactionBId] } } });
  await prisma.category.deleteMany({ where: { id: { in: [categoryAId, categoryBId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
}

function assignmentForm(transactionId: string, categoryId: string) {
  const formData = new FormData();
  formData.set("transactionId", transactionId);
  formData.set("categoryId", categoryId);
  return formData;
}

async function transactionSnapshot(id: string) {
  return prisma.transaction.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      userId: true,
      categoryId: true,
      categorizationSource: true,
      description: true,
      amountCents: true,
      dedupeKey: true,
    },
  });
}

beforeAll(async () => {
  await removeSyntheticFixtures();
  await prisma.user.createMany({
    data: [
      {
        id: userAId,
        name: authenticatedUser.current.name,
        email: authenticatedUser.current.email,
        passwordHash: "synthetic-password-hash-a",
      },
      {
        id: userBId,
        name: "Synthetic Transaction User B",
        email: "transaction-auth-user-b@example.test",
        passwordHash: "synthetic-password-hash-b",
      },
    ],
  });
  await prisma.category.createMany({
    data: [
      categoryFixture({
        id: categoryAId,
        userId: userAId,
        name: "Synthetic Transaction Category A",
      }),
      categoryFixture({
        id: categoryBId,
        userId: userBId,
        name: "SYNTHETIC-B-PRIVATE-CATEGORY-91F4",
      }),
    ],
  });
  await prisma.transaction.createMany({
    data: [
      {
        id: transactionAId,
        userId: userAId,
        occurredAt: new Date("2026-01-10T12:00:00.000Z"),
        description: "Synthetic transaction A",
        amountCents: 12345,
        direction: "EXPENSE",
        dedupeKey: "integration-transaction-auth-dedupe-a",
      },
      {
        id: transactionBId,
        userId: userBId,
        categoryId: categoryBId,
        occurredAt: new Date("2026-01-11T12:00:00.000Z"),
        description: userBPrivateDescription,
        amountCents: 987654,
        direction: "INCOME",
        dedupeKey: "integration-transaction-auth-dedupe-b-private",
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

describe("transaction authorization boundaries", () => {
  it("lists only transactions owned by the authenticated user", async () => {
    const parsed = parseTransactionFilters({});
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const result = await listFilteredUserTransactions({ userId: userAId, filters: parsed.filters });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const serialized = JSON.stringify(result.data.transactions);

    expect(result.data.transactions).toEqual([
      expect.objectContaining({ id: transactionAId, description: "Synthetic transaction A" }),
    ]);
    expect(serialized).not.toContain(transactionBId);
    expect(serialized).not.toContain(categoryBId);
    expect(serialized).not.toContain(userBPrivateDescription);
    expect(serialized).not.toContain("987654");
  });

  it("refuses categorizing another user's transaction without partial changes", async () => {
    const userBBefore = await transactionSnapshot(transactionBId);

    const result = await assignTransactionCategoryAction(
      { status: "idle" },
      assignmentForm(transactionBId, categoryAId),
    );

    expect(result).toEqual({ status: "error", message: "Transacao nao encontrada." });
    await expect(transactionSnapshot(transactionBId)).resolves.toEqual(userBBefore);
    await expect(
      prisma.transaction.count({ where: { id: transactionBId, categoryId: categoryAId } }),
    ).resolves.toBe(0);
  });

  it("refuses assigning another user's category to an owned transaction", async () => {
    const transactionABefore = await transactionSnapshot(transactionAId);
    const userBBefore = await transactionSnapshot(transactionBId);

    const result = await assignTransactionCategoryAction(
      { status: "idle" },
      assignmentForm(transactionAId, categoryBId),
    );

    expect(result).toEqual({ status: "error", message: "Categoria nao encontrada." });
    await expect(transactionSnapshot(transactionAId)).resolves.toEqual(transactionABefore);
    await expect(transactionSnapshot(transactionBId)).resolves.toEqual(userBBefore);
    await expect(
      prisma.transaction.count({ where: { userId: userAId, categoryId: categoryBId } }),
    ).resolves.toBe(0);
  });

  it("returns the same public response for another user's and a missing transaction", async () => {
    const foreignResult = await assignTransactionCategoryAction(
      { status: "idle" },
      assignmentForm(transactionBId, categoryAId),
    );
    const missingResult = await assignTransactionCategoryAction(
      { status: "idle" },
      assignmentForm(missingTransactionId, categoryAId),
    );

    expect(foreignResult).toEqual(missingResult);
    expect(foreignResult).toEqual({ status: "error", message: "Transacao nao encontrada." });
  });

  it("allows a valid assignment without changing any record owned by the other user", async () => {
    const userBBefore = await transactionSnapshot(transactionBId);

    await expect(
      assignTransactionCategoryAction(
        { status: "idle" },
        assignmentForm(transactionAId, categoryAId),
      ),
    ).rejects.toThrow("static generation store missing");

    await expect(transactionSnapshot(transactionAId)).resolves.toEqual(
      expect.objectContaining({
        id: transactionAId,
        userId: userAId,
        categoryId: categoryAId,
        categorizationSource: "USER_MANUAL",
      }),
    );
    await expect(transactionSnapshot(transactionBId)).resolves.toEqual(userBBefore);
    await expect(
      prisma.transaction.count({
        where: {
          OR: [
            { userId: userAId, categoryId: categoryBId },
            { userId: userBId, categoryId: categoryAId },
          ],
        },
      }),
    ).resolves.toBe(0);
  });
});
