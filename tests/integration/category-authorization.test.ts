import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const authenticatedUser = vi.hoisted(() => ({
  current: {
    id: "integration-category-auth-user-a",
    name: "Synthetic Category User A",
    email: "category-auth-user-a@example.test",
  },
}));

vi.mock("@/lib/auth/current-user", () => ({
  requireCurrentUser: vi.fn(async () => authenticatedUser.current),
}));

import {
  createCategoryAction,
  createChildCategoryAction,
  updateCategoryAction,
} from "@/app/categories/actions";
import { listUserCategories } from "@/lib/categories";
import { categoryFixture } from "@/tests/helpers/category-fixture";

const prisma = new PrismaClient();
const userAId = authenticatedUser.current.id;
const userBId = "integration-category-auth-user-b";
const categoryAId = "integration-category-auth-category-a";
const categoryBId = "integration-category-auth-category-b";
const categoryAName = "Synthetic Category A";
const categoryBName = "Synthetic Category B";
const createdCategoryName = "Synthetic Action Category A";

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
        name: "Synthetic Category User B",
        email: "category-auth-user-b@example.test",
        passwordHash: "synthetic-password-hash-b",
      },
    ],
  });

  await prisma.category.createMany({
    data: [
      categoryFixture({ id: categoryAId, userId: userAId, name: categoryAName }),
      categoryFixture({ id: categoryBId, userId: userBId, name: categoryBName }),
    ],
  });
});

afterAll(async () => {
  try {
    await prisma.category.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId] } },
    });
  } finally {
    await prisma.$disconnect();
  }
});

describe("category authorization boundaries", () => {
  it("lists only categories owned by the authenticated user", async () => {
    const result = await listUserCategories(userAId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data).toEqual([
      expect.objectContaining({ id: categoryAId, name: categoryAName, parentId: null }),
    ]);
    expect(JSON.stringify(result.data)).not.toContain(categoryBId);
    expect(JSON.stringify(result.data)).not.toContain(categoryBName);
  });

  it("derives the category owner from the authenticated user", async () => {
    const formData = new FormData();
    formData.set("name", createdCategoryName);
    formData.set("userId", userBId);

    await expect(createCategoryAction({ status: "idle" }, formData)).rejects.toThrow(
      "static generation store missing",
    );
    await expect(
      prisma.category.findFirstOrThrow({
        where: { name: createdCategoryName },
        select: { userId: true },
      }),
    ).resolves.toEqual({ userId: userAId });
  });

  it("refuses an authenticated user editing another user's category", async () => {
    const attemptedName = "Synthetic Cross-User Rename";
    const formData = new FormData();
    formData.set("categoryId", categoryBId);
    formData.set("name", attemptedName);

    const result = await updateCategoryAction({ status: "idle" }, formData);

    expect(result.status).toBe("error");
    await expect(
      prisma.category.findUniqueOrThrow({
        where: { id: categoryBId },
        select: { userId: true, name: true },
      }),
    ).resolves.toEqual({ userId: userBId, name: categoryBName });
    await expect(prisma.category.count({ where: { name: attemptedName } })).resolves.toBe(0);
  });

  it("refuses a child category whose parent belongs to another user", async () => {
    const attemptedChildName = "Synthetic Cross-User Child";
    const formData = new FormData();
    formData.set("parentCategoryId", categoryBId);
    formData.set("name", attemptedChildName);

    const result = await createChildCategoryAction({ status: "idle" }, formData);

    expect(result.status).toBe("error");
    expect(result.message).toBe("Categoria nao encontrada.");
    await expect(
      prisma.category.count({
        where: {
          OR: [{ name: attemptedChildName }, { parentId: categoryBId, userId: userAId }],
        },
      }),
    ).resolves.toBe(0);
  });
});
