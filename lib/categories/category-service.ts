import "server-only";

import { Prisma } from "@prisma/client";

import { categoryFailure } from "@/lib/categories/category-errors";
import type {
  CategoryNode,
  CategoryServiceResult,
  CreateCategoryInput,
  CreateChildCategoryInput,
  UpdateCategoryInput,
} from "@/lib/categories/category-types";
import {
  createCategorySchema,
  createChildCategorySchema,
  listCategoriesSchema,
  normalizeCategoryNameForComparison,
  updateCategorySchema,
} from "@/lib/categories/category-validation";
import { prisma } from "@/lib/db/prisma";

type CategoryRecord = Omit<CategoryNode, "children">;

const categorySelect = {
  id: true,
  name: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

export async function listUserCategories(userId: string): Promise<CategoryServiceResult<CategoryNode[]>> {
  const parsed = listCategoriesSchema.safeParse({ userId });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const categories = await prisma.category.findMany({
      where: { userId: parsed.data.userId },
      select: categorySelect,
    });

    return { ok: true, data: buildCategoryTree(categories) };
  } catch {
    return categoryFailure("UNEXPECTED_ERROR");
  }
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<CategoryServiceResult<CategoryNode>> {
  const parsed = createCategorySchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    if (await hasDuplicateName(parsed.data.userId, null, parsed.data.name)) {
      return categoryFailure("DUPLICATE_NAME");
    }

    const category = await prisma.category.create({
      data: {
        userId: parsed.data.userId,
        parentId: null,
        name: parsed.data.name,
      },
      select: categorySelect,
    });

    return { ok: true, data: toCategoryNode(category) };
  } catch (error) {
    return handleMutationError(error);
  }
}

export async function createChildCategory(
  input: CreateChildCategoryInput,
): Promise<CategoryServiceResult<CategoryNode>> {
  const parsed = createChildCategorySchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const parent = await findCategoryForUser(parsed.data.userId, parsed.data.parentCategoryId);

    if (!parent) {
      return categoryFailure("CATEGORY_NOT_FOUND");
    }

    if (parent.parentId !== null) {
      return categoryFailure("INVALID_PARENT");
    }

    if (await hasDuplicateName(parsed.data.userId, parent.id, parsed.data.name)) {
      return categoryFailure("DUPLICATE_NAME");
    }

    const category = await prisma.category.create({
      data: {
        userId: parsed.data.userId,
        parentId: parent.id,
        name: parsed.data.name,
      },
      select: categorySelect,
    });

    return { ok: true, data: toCategoryNode(category) };
  } catch (error) {
    return handleMutationError(error);
  }
}

export async function updateCategory(
  input: UpdateCategoryInput,
): Promise<CategoryServiceResult<CategoryNode>> {
  const parsed = updateCategorySchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const category = await findCategoryForUser(parsed.data.userId, parsed.data.categoryId);

    if (!category) {
      return categoryFailure("CATEGORY_NOT_FOUND");
    }

    if (
      await hasDuplicateName(
        parsed.data.userId,
        category.parentId,
        parsed.data.name,
        category.id,
      )
    ) {
      return categoryFailure("DUPLICATE_NAME");
    }

    const updateResult = await prisma.category.updateMany({
      where: {
        id: category.id,
        userId: parsed.data.userId,
      },
      data: { name: parsed.data.name },
    });

    if (updateResult.count !== 1) {
      return categoryFailure("CATEGORY_NOT_FOUND");
    }

    const updatedCategory = await findCategoryForUser(parsed.data.userId, category.id);

    return updatedCategory
      ? { ok: true, data: toCategoryNode(updatedCategory) }
      : categoryFailure("CATEGORY_NOT_FOUND");
  } catch (error) {
    return handleMutationError(error);
  }
}

async function findCategoryForUser(userId: string, categoryId: string) {
  return prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: categorySelect,
  });
}

async function hasDuplicateName(
  userId: string,
  parentId: string | null,
  name: string,
  excludedCategoryId?: string,
) {
  const siblings = await prisma.category.findMany({
    where: {
      userId,
      parentId,
      ...(excludedCategoryId ? { id: { not: excludedCategoryId } } : {}),
    },
    select: { name: true },
  });
  const comparableName = normalizeCategoryNameForComparison(name);

  return siblings.some(
    (sibling) => normalizeCategoryNameForComparison(sibling.name) === comparableName,
  );
}

function buildCategoryTree(categories: CategoryRecord[]): CategoryNode[] {
  const nodes = new Map(
    categories.map((category) => [category.id, toCategoryNode(category)]),
  );

  for (const category of categories) {
    if (category.parentId) {
      nodes.get(category.parentId)?.children.push(nodes.get(category.id)!);
    }
  }

  for (const node of nodes.values()) {
    node.children.sort(compareCategoryNames);
  }

  return [...nodes.values()]
    .filter((category) => category.parentId === null)
    .sort(compareCategoryNames);
}

function toCategoryNode(category: CategoryRecord): CategoryNode {
  return { ...category, children: [] };
}

function compareCategoryNames(first: CategoryNode, second: CategoryNode) {
  return first.name.localeCompare(second.name, "pt-BR", { sensitivity: "base" });
}

function validationFailure<T>(error: { flatten(): { fieldErrors: Record<string, string[]> } }) {
  return categoryFailure<T>("VALIDATION_ERROR", error.flatten().fieldErrors);
}

function handleMutationError<T>(error: unknown): CategoryServiceResult<T> {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = Array.isArray(error.meta?.target) ? error.meta.target : [];

    if (target.includes("userId") && target.includes("name") && target.includes("parentId")) {
      return categoryFailure("DUPLICATE_NAME");
    }
  }

  return categoryFailure("UNEXPECTED_ERROR");
}
