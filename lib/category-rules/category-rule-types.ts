export type CategoryRuleListItem = {
  id: string;
  matchText: string;
  normalizedMatchText: string;
  priority: number;
  isActive: boolean;
  category: { id: string; name: string; parentId: string | null };
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCategoryRuleInput = { userId: string; matchText: string; categoryId: string; priority?: number };
export type ToggleCategoryRuleInput = { userId: string; ruleId: string; isActive: boolean };
export type ApplyCategoryRulesSummary = { processedCount: number; categorizedCount: number; unmatchedCount: number; activeRuleCount: number };
export type CategoryRuleErrorCode = "VALIDATION_ERROR" | "CATEGORY_NOT_FOUND" | "RULE_NOT_FOUND" | "DUPLICATE_RULE" | "UNEXPECTED_ERROR";
export type CategoryRuleResult<T> = { ok: true; data: T } | { ok: false; code: CategoryRuleErrorCode; message: string; fieldErrors?: Record<string, string[]> };
