"use server";

import { revalidatePath } from "next/cache";

import type { CategoryRuleActionState } from "@/app/categories/category-rule-action-state";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { applyCategoryRulesToUncategorizedTransactions, createCategoryRule, toggleCategoryRule } from "@/lib/category-rules";

export async function createCategoryRuleAction(_state: CategoryRuleActionState, formData: FormData): Promise<CategoryRuleActionState> {
  const user = await requireCurrentUser();
  const result = await createCategoryRule({ userId: user.id, matchText: readField(formData, "matchText"), categoryId: readField(formData, "categoryId"), priority: Number(readField(formData, "priority")) });
  if (!result.ok) return { status: "error", message: result.message, fieldErrors: result.fieldErrors };
  const applied = await applyCategoryRulesToUncategorizedTransactions(user.id);
  revalidatePath("/categories"); revalidatePath("/transactions");
  if (!applied.ok) return { status: "success", message: "Regra criada, mas nao foi possivel aplica-la agora. Use \"Aplicar regras\"." };
  return { status: "success", message: `Regra criada com sucesso. ${describeCategorized(applied.data.categorizedCount)}`, summary: applied.data };
}

export async function toggleCategoryRuleAction(_state: CategoryRuleActionState, formData: FormData): Promise<CategoryRuleActionState> {
  const user = await requireCurrentUser();
  const result = await toggleCategoryRule({ userId: user.id, ruleId: readField(formData, "ruleId"), isActive: readField(formData, "isActive") === "true" });
  if (!result.ok) return { status: "error", message: result.message };
  if (!result.data.isActive) { revalidatePath("/categories"); return { status: "success", message: "Regra desativada." }; }
  const applied = await applyCategoryRulesToUncategorizedTransactions(user.id);
  revalidatePath("/categories"); revalidatePath("/transactions");
  if (!applied.ok) return { status: "success", message: "Regra ativada, mas nao foi possivel aplica-la agora. Use \"Aplicar regras\"." };
  return { status: "success", message: `Regra ativada. ${describeCategorized(applied.data.categorizedCount)}`, summary: applied.data };
}

export async function applyCategoryRulesAction(_state: CategoryRuleActionState): Promise<CategoryRuleActionState> {
  void _state;
  const user = await requireCurrentUser();
  const result = await applyCategoryRulesToUncategorizedTransactions(user.id);
  if (!result.ok) return { status: "error", message: result.message };
  revalidatePath("/categories"); revalidatePath("/transactions");
  return { status: "success", message: "Regras aplicadas com sucesso.", summary: result.data };
}

function describeCategorized(count: number) { return count === 1 ? "1 transacao categorizada." : `${count} transacoes categorizadas.`; }

function readField(formData: FormData, field: string) { const value = formData.get(field); return typeof value === "string" ? value : ""; }
