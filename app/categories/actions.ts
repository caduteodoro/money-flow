"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/current-user";
import {
  createCategory,
  createChildCategory,
  updateCategory,
  type CategoryServiceResult,
} from "@/lib/categories";

export type CategoryActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialCategoryActionState: CategoryActionState = { status: "idle" };

export async function createCategoryAction(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const user = await requireCurrentUser();
  const result = await createCategory({ userId: user.id, name: readField(formData, "name") });

  return finishAction(result, "Categoria criada com sucesso.");
}

export async function createChildCategoryAction(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const user = await requireCurrentUser();
  const result = await createChildCategory({
    userId: user.id,
    parentCategoryId: readField(formData, "parentCategoryId"),
    name: readField(formData, "name"),
  });

  return finishAction(result, "Subcategoria criada com sucesso.");
}

export async function updateCategoryAction(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const user = await requireCurrentUser();
  const result = await updateCategory({
    userId: user.id,
    categoryId: readField(formData, "categoryId"),
    name: readField(formData, "name"),
  });

  return finishAction(result, "Categoria atualizada com sucesso.");
}

function finishAction<T>(result: CategoryServiceResult<T>, successMessage: string): CategoryActionState {
  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
    };
  }

  revalidatePath("/categories");

  return { status: "success", message: successMessage };
}

function readField(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}
