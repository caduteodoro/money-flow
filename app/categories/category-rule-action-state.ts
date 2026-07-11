import type { ApplyCategoryRulesSummary } from "@/lib/category-rules";

export type CategoryRuleActionState = { status: "idle" | "success" | "error"; message?: string; fieldErrors?: Record<string, string[]>; summary?: ApplyCategoryRulesSummary };
export const initialCategoryRuleActionState: CategoryRuleActionState = { status: "idle" };
