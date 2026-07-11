import "server-only";

import { CategorizationSource } from "@prisma/client";

import { categoryRuleFailure } from "@/lib/category-rules/category-rule-errors";
import type { ApplyCategoryRulesSummary, CategoryRuleListItem, CategoryRuleResult, CreateCategoryRuleInput, ToggleCategoryRuleInput } from "@/lib/category-rules/category-rule-types";
import { createCategoryRuleSchema, listCategoryRulesSchema, normalizeRuleMatchText, toggleCategoryRuleSchema } from "@/lib/category-rules/category-rule-validation";
import { prisma } from "@/lib/db/prisma";

const ruleSelect = { id: true, matchText: true, priority: true, isActive: true, createdAt: true, updatedAt: true, category: { select: { id: true, name: true, parentId: true } } } as const;

export async function listUserCategoryRules(userId: string): Promise<CategoryRuleResult<CategoryRuleListItem[]>> {
  const parsed = listCategoryRulesSchema.safeParse({ userId });
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    const rules = await prisma.categoryRule.findMany({ where: { userId: parsed.data.userId, category: { userId: parsed.data.userId } }, select: ruleSelect, orderBy: [{ priority: "asc" }, { createdAt: "asc" }, { id: "asc" }] });
    return { ok: true, data: rules.map((rule) => ({ ...rule, normalizedMatchText: normalizeRuleMatchText(rule.matchText) })) };
  } catch { return categoryRuleFailure("UNEXPECTED_ERROR"); }
}

export async function createCategoryRule(input: CreateCategoryRuleInput): Promise<CategoryRuleResult<CategoryRuleListItem>> {
  const parsed = createCategoryRuleSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    const category = await prisma.category.findFirst({ where: { id: parsed.data.categoryId, userId: parsed.data.userId }, select: { id: true } });
    if (!category) return categoryRuleFailure("CATEGORY_NOT_FOUND");
    const siblings = await prisma.categoryRule.findMany({ where: { userId: parsed.data.userId, categoryId: category.id }, select: { matchText: true } });
    const normalized = normalizeRuleMatchText(parsed.data.matchText);
    if (siblings.some((rule) => normalizeRuleMatchText(rule.matchText) === normalized)) return categoryRuleFailure("DUPLICATE_RULE");
    const rule = await prisma.categoryRule.create({ data: { userId: parsed.data.userId, categoryId: category.id, name: `Contem: ${parsed.data.matchText}`, matchText: parsed.data.matchText, priority: parsed.data.priority }, select: ruleSelect });
    return { ok: true, data: { ...rule, normalizedMatchText: normalized } };
  } catch { return categoryRuleFailure("UNEXPECTED_ERROR"); }
}

export async function toggleCategoryRule(input: ToggleCategoryRuleInput): Promise<CategoryRuleResult<CategoryRuleListItem>> {
  const parsed = toggleCategoryRuleSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    const found = await prisma.categoryRule.findFirst({ where: { id: parsed.data.ruleId, userId: parsed.data.userId }, select: { id: true } });
    if (!found) return categoryRuleFailure("RULE_NOT_FOUND");
    const update = await prisma.categoryRule.updateMany({ where: { id: found.id, userId: parsed.data.userId }, data: { isActive: parsed.data.isActive } });
    if (update.count !== 1) return categoryRuleFailure("RULE_NOT_FOUND");
    const rule = await prisma.categoryRule.findFirst({ where: { id: found.id, userId: parsed.data.userId, category: { userId: parsed.data.userId } }, select: ruleSelect });
    return rule ? { ok: true, data: { ...rule, normalizedMatchText: normalizeRuleMatchText(rule.matchText) } } : categoryRuleFailure("RULE_NOT_FOUND");
  } catch { return categoryRuleFailure("UNEXPECTED_ERROR"); }
}

export async function applyCategoryRulesToUncategorizedTransactions(userId: string): Promise<CategoryRuleResult<ApplyCategoryRulesSummary>> {
  const parsed = listCategoryRulesSchema.safeParse({ userId });
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    const rules = await prisma.categoryRule.findMany({ where: { userId: parsed.data.userId, isActive: true, category: { userId: parsed.data.userId } }, select: { id: true, categoryId: true, matchText: true }, orderBy: [{ priority: "asc" }, { createdAt: "asc" }, { id: "asc" }] });
    const transactions = await prisma.transaction.findMany({ where: { userId: parsed.data.userId, categoryId: null }, select: { id: true, normalizedDescription: true } });
    let categorizedCount = 0;
    for (const transaction of transactions) {
      const description = transaction.normalizedDescription ? normalizeRuleMatchText(transaction.normalizedDescription) : "";
      const rule = rules.find((candidate) => description.includes(normalizeRuleMatchText(candidate.matchText)));
      if (!rule) continue;
      const result = await prisma.transaction.updateMany({ where: { id: transaction.id, userId: parsed.data.userId, categoryId: null }, data: { categoryId: rule.categoryId, categorizationSource: CategorizationSource.SYSTEM_RULE } });
      categorizedCount += result.count;
    }
    return { ok: true, data: { processedCount: transactions.length, categorizedCount, unmatchedCount: transactions.length - categorizedCount, activeRuleCount: rules.length } };
  } catch { return categoryRuleFailure("UNEXPECTED_ERROR"); }
}

function validationFailure<T>(error: { flatten(): { fieldErrors: Record<string, string[]> } }) { return categoryRuleFailure<T>("VALIDATION_ERROR", error.flatten().fieldErrors); }
