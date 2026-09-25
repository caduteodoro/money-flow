import { PrismaClient, type TransactionDirection } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/dashboard/page";
import { getDashboardSummary } from "@/lib/dashboard/dashboard-service";
import type { DashboardSummary } from "@/lib/dashboard/dashboard-types";
import { buildDashboardDrillThroughUrl, listFilteredUserTransactions, parseTransactionFilters } from "@/lib/transactions";
import { assertTestDatabaseEnvironment } from "@/tests/helpers/assert-test-database.mjs";
import { categoryFixture } from "@/tests/helpers/category-fixture";

assertTestDatabaseEnvironment();
const prisma = new PrismaClient();
const userA = "integration-highlights-a";
const userB = "integration-highlights-b";
const excludedUser = "integration-highlights-excluded";
const emptyUser = "integration-highlights-empty";
const users = [userA, userB, excludedUser, emptyUser];
const categoryA = "integration-highlights-category-a";
const categoryB = "integration-highlights-category-b";
const hash = "d".repeat(64);
const foreignHash = "e".repeat(64);
const now = new Date("2026-08-12T12:00:00Z");

vi.mock("@/lib/auth/current-user", () => ({
  requireCurrentUser: vi.fn(async () => ({ id: "integration-highlights-a", name: "Synthetic A", email: "highlights-a@example.test" })),
}));

async function cleanup() {
  await prisma.transaction.deleteMany({ where: { userId: { in: users } } });
  await prisma.categoryRule.deleteMany({ where: { userId: { in: users } } });
  await prisma.category.deleteMany({ where: { userId: { in: users } } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
}

async function snapshot(userId: string) {
  return Promise.all([
    prisma.transaction.findMany({ where: { userId }, orderBy: { id: "asc" } }),
    prisma.category.findMany({ where: { userId }, orderBy: { id: "asc" } }),
    prisma.categoryRule.findMany({ where: { userId }, orderBy: { id: "asc" } }),
  ]);
}

function row(id: string, userId: string, overrides: {
  descriptionHash?: string | null; normalizedDescription?: string | null; direction?: TransactionDirection;
  occurredAt?: Date; categoryId?: string | null; amountCents?: number;
} = {}) {
  return { id, userId, description: `Synthetic ${id}`, normalizedDescription: "Synthetic matching description", descriptionHash: hash, occurredAt: new Date("2026-08-03T12:00:00Z"), amountCents: -100, direction: "EXPENSE" as TransactionDirection, categoryId: userId === userA ? categoryA : categoryB, categorizationSource: "USER_MANUAL" as const, dedupeKey: id, ...overrides };
}

async function query(queryString: string) {
  const parameters: Record<string, string | string[]> = {};
  for (const [key, value] of new URLSearchParams(queryString)) {
    const previous = parameters[key];
    parameters[key] = previous === undefined ? value : [...(Array.isArray(previous) ? previous : [previous]), value];
  }
  const parsed = parseTransactionFilters(parameters);
  if (!parsed.ok) return parsed;
  return listFilteredUserTransactions({ userId: userA, filters: parsed.filters, now });
}

beforeAll(async () => {
  await cleanup();
  await prisma.user.createMany({ data: users.map((id) => ({ id, name: "Synthetic highlights", email: `${id}@example.test`, passwordHash: "synthetic-hash" })) });
  await prisma.category.createMany({ data: [categoryFixture({ id: categoryA, userId: userA, name: "Synthetic A" }), categoryFixture({ id: categoryB, userId: userB, name: "Synthetic B" })] });
  await prisma.categoryRule.createMany({ data: [{ id: "integration-highlights-rule-a", userId: userA, categoryId: categoryA, name: "Synthetic rule A", matchText: "synthetic", priority: 1 }, { id: "integration-highlights-rule-b", userId: userB, categoryId: categoryB, name: "Synthetic rule B", matchText: "synthetic", priority: 1 }] });
  await prisma.transaction.createMany({ data: [
    ...Array.from({ length: 27 }, (_, index) => row(`integration-highlights-match-${String(index).padStart(2, "0")}`, userA, { descriptionHash: index % 2 ? hash.toUpperCase() : hash })),
    row("integration-highlights-uncategorized", userA, { categoryId: null, normalizedDescription: "Synthetic uncategorized label" }),
    row("integration-highlights-income", userA, { direction: "INCOME", normalizedDescription: "SYNTHETIC-EXCLUDED-INCOME", occurredAt: new Date("2026-08-04T12:00:00Z") }),
    row("integration-highlights-outside", userA, { normalizedDescription: "SYNTHETIC-OUTSIDE-PERIOD", occurredAt: new Date("2026-09-01T00:00:00Z") }),
    row("integration-highlights-hashless-a", userA, { descriptionHash: null, normalizedDescription: " ＣＡＦÉ\tSynthétique " }),
    row("integration-highlights-hashless-b", userA, { descriptionHash: "invalid", normalizedDescription: "café synthétique" }),
    row("integration-highlights-missing", userA, { descriptionHash: null, normalizedDescription: null }),
    row("integration-highlights-whitespace", userA, { descriptionHash: " ", normalizedDescription: " \t\n" }),
    row("integration-highlights-foreign", userB, { normalizedDescription: "SYNTHETIC-FOREIGN-PRIVATE", amountCents: 990000 }),
    row("integration-highlights-foreign-hash", userB, { descriptionHash: foreignHash, normalizedDescription: "SYNTHETIC-FOREIGN-ONLY", amountCents: 880000 }),
    row("integration-highlights-foreign-text", userB, { descriptionHash: null, normalizedDescription: "café synthétique", amountCents: 770000 }),
    row("integration-highlights-transfer", excludedUser, { categoryId: null, direction: "TRANSFER" }),
    row("integration-highlights-reversal", excludedUser, { categoryId: null, direction: "REVERSAL" }),
  ] });
});

afterAll(async () => { try { await cleanup(); } finally { await prisma.$disconnect(); } });

describe("expense highlights exact navigation and isolation", () => {
  it("derives the dashboard owner from the session and ignores client identity", async () => {
    const element = await DashboardPage({ searchParams: Promise.resolve({ period: "imported-period", userId: userB }) });
    const summary = (element as { props: { summary: DashboardSummary } }).props.summary;
    expect(JSON.stringify(summary)).not.toContain("SYNTHETIC-FOREIGN");
    expect(summary.offenders.largestExpenses.every((item) => !item.id.includes("foreign"))).toBe(true);
  });

  it("matches an analytical hash group exactly across pages and hash casing without foreign data", async () => {
    const beforeA = await snapshot(userA);
    const beforeB = await snapshot(userB);
    const summary = await getDashboardSummary({ userId: userA, dateFilter: "current-month", now });
    const group = summary.offenders.topNormalizedDescriptions.find((item) => item.target.kind === "NORMALIZED_DESCRIPTION" && item.target.descriptionHash === hash)!;
    expect(group.transactionCount).toBe(28);
    const url = buildDashboardDrillThroughUrl(group.target, "current-month")!;
    const first = await query(url.split("?")[1]);
    const second = await query(`${url.split("?")[1]}&page=2`);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    const rows = [...first.data.transactions, ...second.data.transactions];
    expect(first.data.pagination.totalItems).toBe(group.transactionCount);
    expect(new Set(rows.map((item) => item.id)).size).toBe(group.transactionCount);
    expect(rows.reduce((total, item) => total + Math.abs(item.amountCents), 0)).toBe(group.amountCents);
    expect(rows.every((item) => item.direction === "EXPENSE")).toBe(true);
    expect(JSON.stringify([first, second])).not.toMatch(/SYNTHETIC-FOREIGN|SYNTHETIC-OUTSIDE|SYNTHETIC-EXCLUDED/);
    await expect(snapshot(userA)).resolves.toEqual(beforeA);
    await expect(snapshot(userB)).resolves.toEqual(beforeB);
  });

  it("combines category, uncategorized, period and direction and derives chip from that same set", async () => {
    for (const filter of [`categoryId=${categoryA}`, "filter=uncategorized"]) {
      const result = await query(`period=current-month&direction=expense&descriptionHash=${hash}&${filter}`);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.data.activeFilters).toContainEqual(expect.objectContaining({ key: "descriptionHash", value: filter.startsWith("categoryId") ? "Synthetic matching description" : "Synthetic uncategorized label" }));
      expect(result.data.pagination.totalItems).toBe(filter.startsWith("categoryId") ? 27 : 1);
      expect(JSON.stringify(result)).not.toMatch(/SYNTHETIC-OUTSIDE|SYNTHETIC-EXCLUDED|SYNTHETIC-FOREIGN/);
    }
    const noResults = await query(`date=2026-08-05&direction=expense&descriptionHash=${hash}`);
    expect(noResults.ok).toBe(true);
    if (noResults.ok) {
      expect(noResults.data.transactions).toEqual([]);
      expect(noResults.data.activeFilters).toContainEqual(expect.objectContaining({ key: "descriptionHash", value: "Descricao selecionada" }));
    }
  });

  it("does not reveal foreign-only hashes and treats foreign and missing references identically", async () => {
    const onlyForeign = await query(`period=current-month&direction=expense&descriptionHash=${foreignHash}`);
    expect(onlyForeign.ok).toBe(true);
    if (onlyForeign.ok) {
      expect(onlyForeign.data.pagination.totalItems).toBe(0);
      expect(JSON.stringify(onlyForeign)).not.toContain("SYNTHETIC-FOREIGN");
    }
    expect(await query(`categoryId=${categoryB}`)).toEqual(await query("categoryId=integration-highlights-missing-category"));
    expect(await query("transactionId=integration-highlights-foreign")).toEqual(await query("transactionId=integration-highlights-missing-transaction"));
    expect(await query(`descriptionRef=integration-highlights-foreign`)).toEqual({ ok: false, reason: "UNKNOWN_PARAMETER" });
  });

  it("keeps exact legacy aggregates visible but intentionally without approximate links", async () => {
    const summary = await getDashboardSummary({ userId: userA, dateFilter: "current-month", now });
    const hashless = summary.offenders.topNormalizedDescriptions.filter((item) => item.target.kind === "UNIDENTIFIED_DESCRIPTION" || item.target.descriptionHash === null);
    expect(hashless).toHaveLength(2);
    expect(hashless.map((item) => item.transactionCount)).toEqual([2, 2]);
    expect(hashless.every((item) => item.amountCents === 200 && buildDashboardDrillThroughUrl(item.target, "current-month") === null)).toBe(true);
    expect(JSON.stringify(hashless)).not.toContain("770000");
  });

  it("distinguishes no data, an empty period, excluded movement and real expense counts", async () => {
    const excluded = await getDashboardSummary({ userId: excludedUser, dateFilter: "current-month", now });
    expect(excluded.periodTransactionCount).toBe(2);
    expect(excluded.kpis.includedTransactionCount).toBe(0);
    expect(excluded.categories.coverage.totalExpenseCount).toBe(0);
    expect(excluded.recentTransactions).toHaveLength(2);
    const empty = await getDashboardSummary({ userId: emptyUser, dateFilter: "imported-period", now });
    expect(empty.hasImportedTransactions).toBe(false);
    expect(empty.periodTransactionCount).toBe(0);
    const noMovement = await getDashboardSummary({ userId: userA, dateFilter: "previous-month", now });
    expect(noMovement.hasImportedTransactions).toBe(true);
    expect(noMovement.periodTransactionCount).toBe(0);
  });
});
