import type { DashboardAnalyticsTransaction, DashboardDateFilterId } from "./dashboard-types";
import { calculateCategoryAnalytics, groupDashboardCategories } from "./dashboard-calculations";
import { normalizeAnalyticsText, resolveDescriptionGroup } from "./description-groups";
import { buildTransactionsUrl } from "@/lib/transactions/transaction-filters";

// At most 1 root + 5 categories + 5 * (3 descriptions + 1 residual) = 26 nodes, 25 links.
export const EXPENSE_FLOW_LIMITS = { categories: 5, descriptions: 3, nodes: 26, links: 25 } as const;

export type ExpenseFlowDescription = {
  id: string;
  label: string;
  amountCents: number;
  percentage: number;
  categoryPercentage: number;
  kind: "DESCRIPTION" | "OTHER_DESCRIPTIONS";
  descriptionHash: string | null;
};
export type ExpenseFlowCategory = {
  id: string;
  label: string;
  amountCents: number;
  percentage: number;
  kind: "ROOT_CATEGORY" | "UNCATEGORIZED" | "OTHER";
  categoryId: string | null;
  exactNavigation: boolean;
  descriptions: ExpenseFlowDescription[];
};
export type ExpenseFlowModel = { totalExpenseCents: number; categories: ExpenseFlowCategory[] };
type Group = { id: string; label: string; amountCents: number; descriptionHash: string | null; hasDescription: boolean };

const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const categoryKey = (id: string | null) => id === null ? "uncategorized" : `category:${id}`;

export function buildExpenseFlow(transactions: readonly DashboardAnalyticsTransaction[]): ExpenseFlowModel {
  // Signs follow existing analytics. Only positive, finite, integer magnitudes enter the flow.
  const omitted = new Map<string, Set<string>>();
  const expenses = transactions.filter(row => {
    if (row.direction !== "EXPENSE") return false;
    if (Number.isSafeInteger(row.amountCents) && Math.abs(row.amountCents) > 0) return true;
    const root = row.category?.parent ?? row.category;
    const key = categoryKey(root?.id ?? null);
    const groups = omitted.get(key) ?? new Set<string>();
    groups.add(resolveDescriptionGroup(row).aggregationKey);
    omitted.set(key, groups);
    return false;
  });
  const analytics = calculateCategoryAnalytics(expenses);
  const totalExpenseCents = analytics.coverage.totalExpenseCents;
  if (!Number.isSafeInteger(totalExpenseCents)) throw new Error("Total do fluxo fora do intervalo seguro.");
  const slots = EXPENSE_FLOW_LIMITS.categories - (analytics.uncategorized.amountCents > 0 ? 1 : 0);
  const grouped = groupDashboardCategories(analytics, analytics.rootCategories.length > slots ? slots - 1 : slots);
  const byCategory = new Map<string, Map<string, Group>>();
  for (const row of expenses) {
    const root = row.category?.parent ?? row.category;
    const key = categoryKey(root?.id ?? null);
    const groups = byCategory.get(key) ?? new Map<string, Group>();
    byCategory.set(key, groups);
    const description = resolveDescriptionGroup(row);
    const hasDescription = description.target.kind === "NORMALIZED_DESCRIPTION" && description.target.normalizedDescription !== null;
    const id = `description:${JSON.stringify([root?.id ?? null, row.id])}`;
    const existing = groups.get(description.aggregationKey);
    if (existing) {
      existing.amountCents += Math.abs(row.amountCents);
      if (compare(id, existing.id) < 0) existing.id = id;
      if (hasDescription && (!existing.hasDescription ||
        compare(normalizeAnalyticsText(description.label), normalizeAnalyticsText(existing.label)) < 0 ||
        (normalizeAnalyticsText(description.label) === normalizeAnalyticsText(existing.label) && compare(description.label, existing.label) < 0))) {
        existing.label = description.label;
        existing.hasDescription = true;
      }
    } else {
      groups.set(description.aggregationKey, { id, label: description.label, hasDescription, amountCents: Math.abs(row.amountCents),
        // Existing list filters cannot exclude zero/invalid amounts. Do not link to a broader group.
        descriptionHash: description.target.kind === "NORMALIZED_DESCRIPTION" && !omitted.get(key)?.has(description.aggregationKey)
          ? description.target.descriptionHash : null });
    }
  }
  const categories: ExpenseFlowCategory[] = [];
  function append(kind: ExpenseFlowCategory["kind"], id: string, label: string, amountCents: number, categoryId: string | null, groups: Group[]) {
    groups.sort((a, b) => b.amountCents - a.amountCents ||
      compare(normalizeAnalyticsText(a.label), normalizeAnalyticsText(b.label)) || compare(a.id, b.id));
    const visible = groups.slice(0, EXPENSE_FLOW_LIMITS.descriptions);
    const rest = groups.slice(EXPENSE_FLOW_LIMITS.descriptions);
    const descriptions: ExpenseFlowDescription[] = visible.map(group => ({ id: group.id, label: group.label,
      amountCents: group.amountCents, descriptionHash: group.descriptionHash, kind: "DESCRIPTION",
      percentage: group.amountCents / totalExpenseCents * 100, categoryPercentage: group.amountCents / amountCents * 100 }));
    if (rest.length) {
      const residual = rest.reduce((sum, group) => sum + group.amountCents, 0);
      descriptions.push({ id: `${id}:other-descriptions`, label: "Outras descrições", amountCents: residual,
        percentage: residual / totalExpenseCents * 100, categoryPercentage: residual / amountCents * 100,
        kind: "OTHER_DESCRIPTIONS", descriptionHash: null });
    }
    if (descriptions.reduce((sum, leaf) => sum + leaf.amountCents, 0) !== amountCents) {
      throw new Error("As descrições não reconciliaram com a categoria do fluxo.");
    }
    categories.push({ id, kind, label, amountCents, percentage: amountCents / totalExpenseCents * 100, categoryId,
      exactNavigation: kind !== "OTHER" && !omitted.has(id), descriptions });
  }
  for (const category of grouped.visibleCategories) {
    const key = categoryKey(category.rootCategoryId);
    append("ROOT_CATEGORY", key, category.rootCategoryName, category.amountCents, category.rootCategoryId, [...(byCategory.get(key)?.values() ?? [])]);
  }
  if (grouped.other) {
    // Keep original categories distinct even inside Outros: identical descriptions are not merged.
    const names = new Map(analytics.rootCategories.map(category => [category.rootCategoryId, category.rootCategoryName]));
    const leaves = grouped.other.target.rootCategoryIds.flatMap(id => {
      const label = names.get(id)!;
      return [...(byCategory.get(categoryKey(id))?.values() ?? [])].map(group => ({ ...group, label: `${group.label} (${label})`, descriptionHash: null }));
    });
    append("OTHER", "other-categories", "Outros", grouped.other.amountCents, null, leaves);
  }
  if (grouped.uncategorized.amountCents > 0) {
    append("UNCATEGORIZED", "uncategorized", "Sem categoria", grouped.uncategorized.amountCents, null,
      [...(byCategory.get("uncategorized")?.values() ?? [])]);
  }
  if (categories.reduce((sum, category) => sum + category.amountCents, 0) !== totalExpenseCents) {
    throw new Error("As categorias não reconciliaram com o total do fluxo.");
  }
  return { totalExpenseCents, categories };
}

export function expenseFlowHref(category: ExpenseFlowCategory, period: DashboardDateFilterId, description?: ExpenseFlowDescription) {
  if (!description && !category.exactNavigation) return null;
  if (category.kind === "OTHER" || (description && (description.kind === "OTHER_DESCRIPTIONS" || !description.descriptionHash))) return null;
  return buildTransactionsUrl({ period, direction: "EXPENSE",
    ...(category.kind === "UNCATEGORIZED" ? { filter: "uncategorized" } : { categoryId: category.categoryId! }),
    ...(description ? { descriptionHash: description.descriptionHash! } : {}) });
}
