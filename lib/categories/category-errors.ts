import type { CategoryErrorCode, CategoryServiceResult } from "@/lib/categories/category-types";

export const CATEGORY_ERROR_MESSAGES = {
  VALIDATION_ERROR: "Revise os campos informados.",
  CATEGORY_NOT_FOUND: "Categoria nao encontrada.",
  DUPLICATE_NAME: "Ja existe uma categoria com esse nome neste nivel.",
  INVALID_PARENT: "A categoria pai informada nao pode receber subcategorias.",
  UNEXPECTED_ERROR: "Nao foi possivel concluir a operacao com a categoria.",
} satisfies Record<CategoryErrorCode, string>;

export function categoryFailure<T>(
  code: CategoryErrorCode,
  fieldErrors?: Record<string, string[]>,
): CategoryServiceResult<T> {
  return {
    ok: false,
    code,
    message: CATEGORY_ERROR_MESSAGES[code],
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}
