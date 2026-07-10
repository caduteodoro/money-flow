import { z } from "zod";

export const normalizedCategoryNameSchema = z
  .string({ error: "Informe o nome da categoria." })
  .transform(normalizeCategoryName)
  .pipe(
    z
      .string()
      .min(1, "Informe o nome da categoria.")
      .max(60, "O nome da categoria deve ter no maximo 60 caracteres."),
  );

export const createCategorySchema = z.object({
  userId: requiredIdentifier("Usuario autenticado obrigatorio."),
  name: normalizedCategoryNameSchema,
});

export const createChildCategorySchema = z.object({
  userId: requiredIdentifier("Usuario autenticado obrigatorio."),
  parentCategoryId: requiredIdentifier("Categoria pai obrigatoria."),
  name: normalizedCategoryNameSchema,
});

export const updateCategorySchema = z.object({
  userId: requiredIdentifier("Usuario autenticado obrigatorio."),
  categoryId: requiredIdentifier("Categoria obrigatoria."),
  name: normalizedCategoryNameSchema,
});

export const listCategoriesSchema = z.object({
  userId: requiredIdentifier("Usuario autenticado obrigatorio."),
});

export function normalizeCategoryName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeCategoryNameForComparison(name: string) {
  return normalizeCategoryName(name).toLocaleLowerCase("pt-BR");
}

function requiredIdentifier(message: string) {
  return z.string({ error: message }).trim().min(1, message);
}
