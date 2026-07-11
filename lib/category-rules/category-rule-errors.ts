import type { CategoryRuleErrorCode, CategoryRuleResult } from "@/lib/category-rules/category-rule-types";

const messages: Record<CategoryRuleErrorCode, string> = {
  VALIDATION_ERROR: "Revise os campos informados.", CATEGORY_NOT_FOUND: "Categoria nao encontrada.", RULE_NOT_FOUND: "Regra nao encontrada.",
  DUPLICATE_RULE: "Ja existe uma regra equivalente para esta categoria.", UNEXPECTED_ERROR: "Nao foi possivel concluir a operacao com a regra.",
};
export function categoryRuleFailure<T>(code: CategoryRuleErrorCode, fieldErrors?: Record<string, string[]>): CategoryRuleResult<T> {
  return { ok: false, code, message: messages[code], ...(fieldErrors ? { fieldErrors } : {}) };
}
