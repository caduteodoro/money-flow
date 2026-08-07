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
type DuplicateContext = {
  userId: string;
  parentId: string | null;
  comparisonKey: string;
  excludedCategoryId?: string;
};

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

  const comparisonKey = normalizeCategoryNameForComparison(parsed.data.name);
  const duplicateContext = {
    userId: parsed.data.userId,
    parentId: null,
    comparisonKey,
  } satisfies DuplicateContext;

  try {
    if (await hasDuplicateName(duplicateContext)) {
      return categoryFailure("DUPLICATE_NAME");
    }

    const category = await prisma.category.create({
      data: {
        userId: parsed.data.userId,
        parentId: null,
        name: parsed.data.name,
        comparisonKey,
      },
      select: categorySelect,
    });

    return { ok: true, data: toCategoryNode(category) };
  } catch (error) {
    return handleMutationError(error, duplicateContext);
  }
}

export async function createChildCategory(
  input: CreateChildCategoryInput,
): Promise<CategoryServiceResult<CategoryNode>> {
  const parsed = createChildCategorySchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const comparisonKey = normalizeCategoryNameForComparison(parsed.data.name);
  let duplicateContext: DuplicateContext | undefined;

  try {
    const parent = await findCategoryForUser(parsed.data.userId, parsed.data.parentCategoryId);

    if (!parent) {
      return categoryFailure("CATEGORY_NOT_FOUND");
    }

    if (parent.parentId !== null) {
      return categoryFailure("INVALID_PARENT");
    }

    duplicateContext = {
      userId: parsed.data.userId,
      parentId: parent.id,
      comparisonKey,
    };

    if (await hasDuplicateName(duplicateContext)) {
      return categoryFailure("DUPLICATE_NAME");
    }

    const category = await prisma.category.create({
      data: {
        userId: parsed.data.userId,
        parentId: parent.id,
        name: parsed.data.name,
        comparisonKey,
      },
      select: categorySelect,
    });

    return { ok: true, data: toCategoryNode(category) };
  } catch (error) {
    return duplicateContext
      ? handleMutationError(error, duplicateContext)
      : categoryFailure("UNEXPECTED_ERROR");
  }
}

export async function updateCategory(
  input: UpdateCategoryInput,
): Promise<CategoryServiceResult<CategoryNode>> {
  const parsed = updateCategorySchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const comparisonKey = normalizeCategoryNameForComparison(parsed.data.name);
  let duplicateContext: DuplicateContext | undefined;

  try {
    const category = await findCategoryForUser(parsed.data.userId, parsed.data.categoryId);

    if (!category) {
      return categoryFailure("CATEGORY_NOT_FOUND");
    }

    duplicateContext = {
      userId: parsed.data.userId,
      parentId: category.parentId,
      comparisonKey,
      excludedCategoryId: category.id,
    };

    if (await hasDuplicateName(duplicateContext)) {
      return categoryFailure("DUPLICATE_NAME");
    }

    const updateResult = await prisma.category.updateMany({
      where: {
        id: category.id,
        userId: parsed.data.userId,
      },
      data: { name: parsed.data.name, comparisonKey },
    });

    if (updateResult.count !== 1) {
      return categoryFailure("CATEGORY_NOT_FOUND");
    }

    const updatedCategory = await findCategoryForUser(parsed.data.userId, category.id);

    return updatedCategory
      ? { ok: true, data: toCategoryNode(updatedCategory) }
      : categoryFailure("CATEGORY_NOT_FOUND");
  } catch (error) {
    return duplicateContext
      ? handleMutationError(error, duplicateContext)
      : categoryFailure("UNEXPECTED_ERROR");
  }
}

async function findCategoryForUser(userId: string, categoryId: string) {
  return prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: categorySelect,
  });
}

async function hasDuplicateName({
  userId,
  parentId,
  comparisonKey,
  excludedCategoryId,
}: DuplicateContext) {
  const sibling = await prisma.category.findFirst({
    where: {
      userId,
      parentId,
      comparisonKey,
      ...(excludedCategoryId ? { id: { not: excludedCategoryId } } : {}),
    },
    select: { id: true },
  });

  return sibling !== null;
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

async function handleMutationError<T>(
  error: unknown,
  duplicateContext: DuplicateContext,
): Promise<CategoryServiceResult<T>> {
  if (!isCategoryNameUniqueConstraintError(error, duplicateContext.parentId)) {
    return categoryFailure("UNEXPECTED_ERROR");
  }

  try {
    if (await hasDuplicateName(duplicateContext)) {
      return categoryFailure("DUPLICATE_NAME");
    }
  } catch {
    return categoryFailure("UNEXPECTED_ERROR");
  }

  return categoryFailure("UNEXPECTED_ERROR");
}

function isCategoryNameUniqueConstraintError(error: unknown, parentId: string | null) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
  const expectedTarget = parentId === null
    ? ["userId", "comparisonKey"]
    : ["userId", "comparisonKey", "parentId"];

  return (
    target.length === expectedTarget.length &&
    expectedTarget.every((field) => target.includes(field))
  );
}
