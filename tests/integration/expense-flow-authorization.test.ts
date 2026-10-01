import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { getDashboardSummary } from "@/lib/dashboard/dashboard-service";
import { expenseFlowHref } from "@/lib/dashboard/expense-flow";
import { listFilteredUserTransactions, parseTransactionFilters } from "@/lib/transactions";
import { assertTestDatabaseEnvironment } from "../helpers/assert-test-database.mjs";
import { categoryFixture } from "../helpers/category-fixture";

assertTestDatabaseEnvironment();
const userA = "integration-flow-a", userB = "integration-flow-b";
const rootA = "integration-flow-root-a", childA = "integration-flow-child-a", rootB = "integration-flow-root-b";
const hash = "b".repeat(64);
const now = new Date("2026-08-12T12:00:00Z");
const users = [userA, userB];
async function cleanup() {
  await prisma.transaction.deleteMany({ where: { userId: { in: users } } });
  await prisma.category.deleteMany({ where: { userId: { in: users } }, });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
}
function transaction(id: string, userId = userA, changes = {}) {
  return { id: `integration-flow-${id}`, userId, dedupeKey: `integration-flow-${id}`, description: "Synthetic original",
    normalizedDescription: "Synthetic shared", descriptionHash: hash, occurredAt: new Date("2026-08-01T00:00:00Z"),
    amountCents: -100, direction: "EXPENSE" as const, categoryId: userId === userA ? childA : rootB,
    categorizationSource: "USER_MANUAL" as const, ...changes };
}
beforeAll(async () => {
  await cleanup();
  await prisma.user.createMany({ data: users.map(id => ({ id, name: "Synthetic flow user", email: `${id}@example.test`, passwordHash: "synthetic-hash" })) });
  await prisma.category.createMany({ data: [categoryFixture({ id: rootA, userId: userA, name: "Synthetic A" }), categoryFixture({ id: rootB, userId: userB, name: "Synthetic B" })] });
  await prisma.category.create({ data: categoryFixture({ id: childA, userId: userA, name: "Synthetic child", parentId: rootA }) });
  await prisma.transaction.createMany({ data: [
    ...Array.from({ length: 28 }, (_, i) => transaction(`match-${i}`, userA, { descriptionHash: i % 2 ? hash.toUpperCase() : hash, amountCents: i % 2 ? 100 : -100 })),
    transaction("uncategorized", userA, { categoryId: null }),
    transaction("missing", userA, { descriptionHash: null, normalizedDescription: null }),
    transaction("hashless", userA, { descriptionHash: null, normalizedDescription: "Synthetic legacy" }),
    transaction("previous", userA, { occurredAt: new Date("2026-07-31T23:59:59.999Z") }),
    transaction("next", userA, { occurredAt: new Date("2026-09-01T00:00:00Z") }),
    transaction("income", userA, { direction: "INCOME" }), transaction("transfer", userA, { direction: "TRANSFER" }),
    transaction("reversal", userA, { direction: "REVERSAL" }), transaction("zero", userA, { amountCents: 0, descriptionHash: null }),
    transaction("foreign", userB, { amountCents: -99999, normalizedDescription: "SYNTHETIC-FOREIGN" }),
  ] });
});
afterAll(async () => { try { await cleanup(); } finally { await prisma.$disconnect(); } });
async function list(url: string) {
  const parsed = parseTransactionFilters(Object.fromEntries(new URLSearchParams(url.split("?")[1])));
  if (!parsed.ok) throw new Error("Synthetic generated filters invalid");
  return listFilteredUserTransactions({ userId: userA, filters: parsed.filters, now });
}

describe("expense flow service and query authorization", () => {
  it("uses the existing bounded-period queries without N+1 and reconciles current dashboard totals", async () => {
    const query = vi.spyOn(prisma.transaction, "findMany");
    const count = vi.spyOn(prisma.transaction, "count");
    try {
      const summary = await getDashboardSummary({ userId: userA, dateFilter: "current-month", now });
      expect(query).toHaveBeenCalledTimes(2); expect(count).toHaveBeenCalledTimes(1);
      expect(query.mock.calls.every(([args]) => args?.where?.userId === userA)).toBe(true);
      expect(summary.expenseFlow.totalExpenseCents).toBe(3100);
      expect(summary.expenseFlow.totalExpenseCents).toBe(summary.kpis.totalExpenseCents);
      expect(summary.expenseFlow.totalExpenseCents).toBe(summary.categories.coverage.totalExpenseCents);
      expect(summary.expenseFlow.categories.flatMap(category => category.descriptions).reduce((sum, leaf) => sum + leaf.amountCents, 0)).toBe(3100);
      expect(JSON.stringify(summary.expenseFlow)).not.toContain("SYNTHETIC-FOREIGN");
      expect(summary.expenseFlow.categories.find(category => category.categoryId === rootA)?.amountCents).toBe(3000);
    } finally { query.mockRestore(); count.mockRestore(); }
  });
  it("navigates hash plus root category exactly across pages, preserving manual data", async () => {
    const before = await prisma.transaction.findMany({ where: { userId: userA }, orderBy: { id: "asc" } });
    const summary = await getDashboardSummary({ userId: userA, dateFilter: "current-month", now });
    const category = summary.expenseFlow.categories.find(category => category.categoryId === rootA)!;
    const description = category.descriptions.find(leaf => leaf.descriptionHash === hash)!;
    const href = expenseFlowHref(category, "current-month", description)!;
    const first = await list(href), second = await list(href + "&page=2");
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) throw new Error("Synthetic navigation failed");
    const rows = [...first.data.transactions, ...second.data.transactions];
    expect(rows).toHaveLength(28);
    expect(rows.reduce((sum, row) => sum + Math.abs(row.amountCents), 0)).toBe(description.amountCents);
    expect(rows.every(row => row.direction === "EXPENSE")).toBe(true);
    expect(await prisma.transaction.findMany({ where: { userId: userA }, orderBy: { id: "asc" } })).toEqual(before);
  });
  it("keeps uncategorized and missing descriptions and refuses approximate legacy links", async () => {
    const { expenseFlow } = await getDashboardSummary({ userId: userA, dateFilter: "current-month", now });
    const uncategorized = expenseFlow.categories.find(category => category.kind === "UNCATEGORIZED")!;
    const result = await list(expenseFlowHref(uncategorized, "current-month", uncategorized.descriptions[0])!);
    expect(result.ok && result.data.pagination.totalItems).toBe(1);
    const leaves = expenseFlow.categories.flatMap(category => category.descriptions.filter(leaf => !leaf.descriptionHash).map(leaf => ({ category, leaf })));
    expect(leaves.some(({ leaf }) => leaf.label === "Descrição não identificada")).toBe(true);
    expect(leaves.every(({ category, leaf }) => expenseFlowHref(category, "current-month", leaf) === null)).toBe(true);
  });
  it("preserves period boundaries and tenant isolation for matching hashes", async () => {
    expect((await getDashboardSummary({ userId: userA, dateFilter: "previous-month", now })).expenseFlow.totalExpenseCents).toBe(100);
    expect((await getDashboardSummary({ userId: userB, dateFilter: "current-month", now })).expenseFlow.totalExpenseCents).toBe(99999);
    const foreign = await list(`/transactions?period=current-month&direction=expense&categoryId=${rootB}&descriptionHash=${hash}`);
    const missing = await list(`/transactions?period=current-month&direction=expense&categoryId=missing&descriptionHash=${hash}`);
    expect(foreign).toEqual(missing); expect(foreign.ok).toBe(false);
  });
});
