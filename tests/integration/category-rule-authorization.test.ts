import {
  CategorizationSource,
  PrismaClient,
  TransactionDirection,
} from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const authenticatedUser = vi.hoisted(() => ({
  current: {
    id: "integration-rule-auth-user-a",
    name: "Synthetic Rule User A",
    email: "rule-auth-user-a@example.test",
  },
}));

vi.mock("@/lib/auth/current-user", () => ({
  requireCurrentUser: vi.fn(async () => authenticatedUser.current),
}));

import {
  applyCategoryRulesAction,
  createCategoryRuleAction,
  toggleCategoryRuleAction,
} from "@/app/categories/rule-actions";
import { listUserCategoryRules } from "@/lib/category-rules";

const prisma = new PrismaClient();
const userAId = authenticatedUser.current.id;
const userBId = "integration-rule-auth-user-b";
const categoryAId = "integration-rule-auth-category-a";
const categoryBId = "integration-rule-auth-category-b";
const ruleAId = "integration-rule-auth-rule-a";
const ruleBId = "integration-rule-auth-rule-b";
const transactionAId = "integration-rule-auth-transaction-a";
const transactionBId = "integration-rule-auth-transaction-b";
const ruleAMatchText = "synthetic user a merchant";
const ruleBMatchText = "synthetic user b merchant";
const attemptedRuleMatchText = "synthetic unauthorized rule";

beforeAll(async () => {
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
        name: "Synthetic Rule User B",
        email: "rule-auth-user-b@example.test",
        passwordHash: "synthetic-password-hash-b",
      },
    ],
  });

  await prisma.category.createMany({
    data: [
      { id: categoryAId, userId: userAId, name: "Synthetic Rule Category A" },
      { id: categoryBId, userId: userBId, name: "Synthetic Rule Category B" },
    ],
  });

  await prisma.categoryRule.createMany({
    data: [
      {
        id: ruleAId,
        userId: userAId,
        categoryId: categoryAId,
        name: "Synthetic Rule A",
        matchText: ruleAMatchText,
        priority: 100,
      },
      {
        id: ruleBId,
        userId: userBId,
        categoryId: categoryBId,
        name: "Synthetic Rule B",
        matchText: ruleBMatchText,
        priority: 1,
      },
    ],
  });

  await prisma.transaction.createMany({
    data: [
      {
        id: transactionAId,
        userId: userAId,
        occurredAt: new Date("2026-01-01T12:00:00.000Z"),
        description: "Synthetic transaction A",
        normalizedDescription: `${ruleBMatchText} ${ruleAMatchText}`,
        amountCents: 100,
        direction: TransactionDirection.EXPENSE,
        dedupeKey: "integration-rule-auth-dedupe-a",
      },
      {
        id: transactionBId,
        userId: userBId,
        occurredAt: new Date("2026-01-02T12:00:00.000Z"),
        description: "Synthetic transaction B",
        normalizedDescription: ruleBMatchText,
        amountCents: 200,
        direction: TransactionDirection.EXPENSE,
        dedupeKey: "integration-rule-auth-dedupe-b",
      },
    ],
  });
});

afterAll(async () => {
  try {
    await prisma.transaction.deleteMany({
      where: { id: { in: [transactionAId, transactionBId] } },
    });
    await prisma.categoryRule.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.category.deleteMany({
      where: { id: { in: [categoryAId, categoryBId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId] } },
    });
  } finally {
    await prisma.$disconnect();
  }
});

describe("category rule authorization boundaries", () => {
  it("lists only rules and related categories owned by the authenticated user", async () => {
    const result = await listUserCategoryRules(userAId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data).toEqual([
      expect.objectContaining({
        id: ruleAId,
        matchText: ruleAMatchText,
        category: expect.objectContaining({ id: categoryAId }),
      }),
    ]);
    expect(JSON.stringify(result.data)).not.toContain(ruleBId);
    expect(JSON.stringify(result.data)).not.toContain(ruleBMatchText);
    expect(JSON.stringify(result.data)).not.toContain(categoryBId);
    expect(JSON.stringify(result.data)).not.toContain("Synthetic Rule Category B");
  });

  it("refuses creating a rule with another user's category", async () => {
    const formData = new FormData();
    formData.set("matchText", attemptedRuleMatchText);
    formData.set("categoryId", categoryBId);
    formData.set("priority", "10");

    const result = await createCategoryRuleAction({ status: "idle" }, formData);

    expect(result).toEqual({
      status: "error",
      message: "Categoria nao encontrada.",
      fieldErrors: undefined,
    });
    await expect(
      prisma.categoryRule.count({
        where: {
          OR: [
            { userId: userAId, categoryId: categoryBId },
            { userId: userAId, matchText: attemptedRuleMatchText },
          ],
        },
      }),
    ).resolves.toBe(0);
  });

  it("refuses toggling another user's rule without changing any rule", async () => {
    const rulesBefore = await prisma.categoryRule.findMany({
      where: { id: { in: [ruleAId, ruleBId] } },
      orderBy: { id: "asc" },
    });
    const formData = new FormData();
    formData.set("ruleId", ruleBId);
    formData.set("isActive", "false");

    const result = await toggleCategoryRuleAction({ status: "idle" }, formData);

    expect(result).toEqual({ status: "error", message: "Regra nao encontrada." });
    await expect(
      prisma.categoryRule.findMany({
        where: { id: { in: [ruleAId, ruleBId] } },
        orderBy: { id: "asc" },
      }),
    ).resolves.toEqual(rulesBefore);
  });

  it("returns equivalent public responses for foreign and nonexistent rules", async () => {
    const foreignRuleForm = new FormData();
    foreignRuleForm.set("ruleId", ruleBId);
    foreignRuleForm.set("isActive", "false");
    const nonexistentRuleForm = new FormData();
    nonexistentRuleForm.set("ruleId", "integration-rule-auth-rule-missing");
    nonexistentRuleForm.set("isActive", "false");

    const foreignResult = await toggleCategoryRuleAction(
      { status: "idle" },
      foreignRuleForm,
    );
    const nonexistentResult = await toggleCategoryRuleAction(
      { status: "idle" },
      nonexistentRuleForm,
    );

    expect(foreignResult).toEqual(nonexistentResult);
    expect(foreignResult).toEqual({
      status: "error",
      message: "Regra nao encontrada.",
    });
  });

  it("applies only the authenticated user's rules to their transactions", async () => {
    const ruleBBefore = await prisma.categoryRule.findUniqueOrThrow({
      where: { id: ruleBId },
    });
    const transactionBBefore = await prisma.transaction.findUniqueOrThrow({
      where: { id: transactionBId },
    });

    await expect(applyCategoryRulesAction({ status: "idle" })).rejects.toThrow(
      "static generation store missing",
    );

    await expect(
      prisma.transaction.findUniqueOrThrow({
        where: { id: transactionAId },
        select: { userId: true, categoryId: true, categorizationSource: true },
      }),
    ).resolves.toEqual({
      userId: userAId,
      categoryId: categoryAId,
      categorizationSource: CategorizationSource.SYSTEM_RULE,
    });
    await expect(
      prisma.transaction.findUniqueOrThrow({ where: { id: transactionBId } }),
    ).resolves.toEqual(transactionBBefore);
    await expect(
      prisma.categoryRule.findUniqueOrThrow({ where: { id: ruleBId } }),
    ).resolves.toEqual(ruleBBefore);
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
