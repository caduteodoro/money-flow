export type CategoryNode = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  children: CategoryNode[];
};

export type CategoryNavigationNode = Omit<CategoryNode, "children"> & {
  directExpenseCount: number;
  totalExpenseCount: number;
  children: CategoryNavigationNode[];
};

export type CategoryNavigationData = {
  categories: CategoryNavigationNode[];
  uncategorizedExpenseCount: number;
};

export type CreateCategoryInput = {
  userId: string;
  name: string;
};

export type CreateChildCategoryInput = {
  userId: string;
  parentCategoryId: string;
  name: string;
};

export type UpdateCategoryInput = {
  userId: string;
  categoryId: string;
  name: string;
};

export type CategoryErrorCode =
  | "VALIDATION_ERROR"
  | "CATEGORY_NOT_FOUND"
  | "DUPLICATE_NAME"
  | "INVALID_PARENT"
  | "UNEXPECTED_ERROR";

export type CategoryServiceResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: CategoryErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };
