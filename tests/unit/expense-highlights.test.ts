import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ExpenseHighlights } from "@/components/dashboard/expense-highlights";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { buildDashboardOffenders, calculateCategoryAnalytics, calculateFinancialKpis, buildDashboardKpiComparisons } from "@/lib/dashboard/dashboard-calculations";
import { parseDescriptionHash, resolveDescriptionGroup } from "@/lib/dashboard/description-groups";
import type { DashboardAnalyticsTransaction, DashboardSummary } from "@/lib/dashboard/dashboard-types";
import { buildDashboardDrillThroughUrl } from "@/lib/transactions/transaction-filters";

const hash = "a".repeat(64);
function transaction(id: string, overrides: Partial<DashboardAnalyticsTransaction> = {}): DashboardAnalyticsTransaction {
  return { id, occurredAt: new Date("2026-12-31T23:59:59.999Z"), description: "Synthetic original", normalizedDescription: null, descriptionHash: null, amountCents: -100, direction: "EXPENSE", category: null, categoryId: null, categorizationSource: "USER_MANUAL", ...overrides };
}
function analyze(transactions: DashboardAnalyticsTransaction[]) {
  const categories = calculateCategoryAnalytics(transactions);
  return { categories, offenders: buildDashboardOffenders(transactions, categories, { largestExpenses: 5, normalizedDescriptions: 5, expenseDays: 5 }) };
}
function render(transactions: DashboardAnalyticsTransaction[]) {
  const { categories, offenders } = analyze(transactions);
  return renderToStaticMarkup(createElement(ExpenseHighlights, { offenders, period: "current-month", totalExpenseCents: categories.coverage.totalExpenseCents, expenseCount: categories.coverage.totalExpenseCount }));
}

describe("description group identity and exact navigation", () => {
  it.each([null, "", " ", "bad-hash", ` ${hash}`, `${hash}\n`])("rejects invalid hash %j", (value) => {
    expect(parseDescriptionHash(value)).toBeNull();
  });

  it("shares case-insensitive valid hashes but keeps hashless text in a separate group", () => {
    const rows = [transaction("a", { descriptionHash: hash, normalizedDescription: "Synthetic alpha" }), transaction("b", { descriptionHash: hash.toUpperCase(), normalizedDescription: "Synthetic beta" }), transaction("c", { normalizedDescription: "Synthetic alpha" })];
    const { offenders } = analyze(rows);
    expect(offenders.topNormalizedDescriptions.map((item) => item.transactionCount)).toEqual([2, 1]);
    expect(offenders.topNormalizedDescriptions[0].label).toBe("Synthetic alpha");
    expect(buildDashboardDrillThroughUrl(offenders.topNormalizedDescriptions[0].target, "current-month")).toBe(`/transactions?period=current-month&direction=expense&descriptionHash=${hash}`);
    expect(buildDashboardDrillThroughUrl(offenders.topNormalizedDescriptions[1].target, "current-month")).toBeNull();
    expect(analyze([...rows].reverse()).offenders).toEqual(offenders);
  });

  it("normalizes Unicode and whitespace without changing import data or using descriptions as public keys", () => {
    const rows = [transaction("b", { normalizedDescription: "  ＣＡＦÉ\tSintético  " }), transaction("a", { normalizedDescription: "café sintético", descriptionHash: "invalid" })];
    const before = structuredClone(rows);
    const { offenders } = analyze(rows);
    expect(offenders.topNormalizedDescriptions).toHaveLength(1);
    expect(offenders.topNormalizedDescriptions[0]).toMatchObject({ key: "description-group:a", amountCents: 200, transactionCount: 2 });
    expect(buildDashboardDrillThroughUrl(offenders.topNormalizedDescriptions[0].target, "current-month")).toBeNull();
    expect(rows).toEqual(before);
    expect(analyze([...rows].reverse()).offenders).toEqual(offenders);
  });

  it("groups missing, blank and whitespace descriptions; hash-only groups remain distinct and navigable", () => {
    const rows = [transaction("a"), transaction("b", { normalizedDescription: "" }), transaction("c", { normalizedDescription: "\t\n ", descriptionHash: " " }), transaction("d", { descriptionHash: hash })];
    const { offenders } = analyze(rows);
    expect(offenders.topNormalizedDescriptions.map((item) => item.transactionCount)).toEqual([3, 1]);
    expect(offenders.topNormalizedDescriptions.every((item) => item.label === "Descrição não identificada")).toBe(true);
    expect(buildDashboardDrillThroughUrl(offenders.topNormalizedDescriptions[0].target, "current-month")).toBeNull();
    expect(buildDashboardDrillThroughUrl(offenders.topNormalizedDescriptions[1].target, "current-month")).toContain("descriptionHash=");
    expect(resolveDescriptionGroup({ descriptionHash: "invalid", normalizedDescription: null }).target.kind).toBe("UNIDENTIFIED_DESCRIPTION");
  });

  it("never generates navigation for a malformed hash target", () => {
    expect(buildDashboardDrillThroughUrl({ kind: "NORMALIZED_DESCRIPTION", descriptionHash: "invalid", normalizedDescription: "Synthetic" }, "current-month")).toBeNull();
  });
});

describe("expense highlight presentation", () => {
  it("shows the approved headings, partial ranking context and exact links using only expenses", () => {
    const html = render([transaction("own", { descriptionHash: hash, normalizedDescription: "Synthetic expense", amountCents: 100 }), ...(["INCOME", "TRANSFER", "REVERSAL"] as const).map((direction) => transaction(direction, { direction, description: `Excluded ${direction}`, amountCents: 9000 }))]);
    for (const title of ["Principais gastos do período", "Quais descrições mais pesaram?", "Quais foram as maiores saídas?", "Em quais dias você mais gastou?"]) expect(html).toContain(title);
    expect(html).toContain("apenas parte do total");
    expect(html).toContain("100% das saídas");
    expect(html).toContain("1 transação");
    expect(html).toContain("period=current-month&amp;transactionId=own");
    expect(html).toContain("date=2026-12-31&amp;direction=expense");
    expect(html).toContain(`direction=expense&amp;descriptionHash=${hash}`);
    expect(html).not.toContain("Excluded");
    expect(html).not.toMatch(/ofensores|estabelecimento|<table|role="tab"/i);
    expect(html.match(/<li /g)).toHaveLength(3);
    expect(html).toContain("focus-visible:outline");
    expect(html).toContain("min-h-11");
  });

  it("keeps complete hostile and long descriptions as escaped text with native expansion", () => {
    const description = `<script>Synthetic</script>${"Á👩🏽‍💻".repeat(100)}`;
    const html = render([transaction("long", { description, normalizedDescription: description, amountCents: 2_147_483_647 })]);
    expect(html).toContain("&lt;script&gt;Synthetic&lt;/script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("Á👩🏽‍💻".repeat(100));
    expect(html).toContain("<details");
    expect(html).toContain("group-open:line-clamp-none");
    expect(html).toContain("[overflow-wrap:anywhere]");
    expect(html).toContain("grid-cols-1");
    expect(html).toContain("Consulta exata indisponível para este grupo.");
    expect(html).not.toContain("descriptionHash=");
  });

  it.each([[], [transaction("income", { direction: "INCOME" })], [transaction("transfer", { direction: "TRANSFER" }), transaction("reversal", { direction: "REVERSAL" })]].map((rows) => ({ rows })))("shows a neutral no-expense state without empty lists", ({ rows }) => {
    const html = render(rows);
    expect(html).toContain("Não há saídas neste período");
    expect(html).not.toContain("<ol");
  });

  it("keeps zero-value expenses and missing descriptions without inventing a percentage", () => {
    const html = render([transaction("zero", { amountCents: 0, description: " \t" })]);
    expect(html).toContain("têm valor zero");
    expect(html).toContain("Percentual sem base");
    expect(html).toContain("Descrição não identificada");
    expect(html).not.toMatch(/NaN|Infinity|0% das saídas/);
    expect(html).toContain("transactionId=zero");
  });

  it("limits every ranking to five, preserves expense magnitude and UTC year/month boundaries", () => {
    const rows = Array.from({ length: 7 }, (_, index) => transaction(`id-${index}`, { occurredAt: new Date(Date.UTC(2027, 0, index)), amountCents: index % 2 ? index + 1 : -index - 1, normalizedDescription: `Synthetic ${index}` }));
    const { offenders } = analyze(rows);
    expect(offenders.largestExpenses.map((item) => item.amountCents)).toEqual([7, 6, 5, 4, 3]);
    expect(offenders.topNormalizedDescriptions).toHaveLength(5);
    expect(offenders.topExpenseDays).toHaveLength(5);
    expect(render(rows).match(/<li /g)).toHaveLength(15);
    const boundary = analyze([transaction("new-year", { occurredAt: new Date("2027-01-01T00:00:00Z") }), transaction("old-year")]);
    expect(boundary.offenders.topExpenseDays.map((item) => item.date)).toEqual(["2026-12-31", "2027-01-01"]);
    expect(render([transaction("old-year")])).toContain("31/12/2026");
  });
});

function shell(rows: DashboardAnalyticsTransaction[], hasImportedTransactions = true) {
  const kpis = calculateFinancialKpis(rows);
  const { categories, offenders } = analyze(rows);
  const summary: DashboardSummary = {
    period: { filter: "current-month", startInclusive: new Date("2026-12-01T00:00:00Z"), endExclusive: new Date("2027-01-01T00:00:00Z"), dayCount: 31 },
    comparisonPeriod: null, hasImportedTransactions, periodTransactionCount: rows.length, kpis,
    comparisons: buildDashboardKpiComparisons(kpis, null), largestExpense: offenders.largestExpenses[0] ?? null,
    recentTransactions: rows.map((row) => ({ id: row.id, occurredAt: row.occurredAt.toISOString(), amountCents: row.amountCents, direction: row.direction, description: row.description, category: null })),
    charts: { granularity: "day", cashflow: [], incomeExpense: { incomeCents: kpis.totalIncomeCents, expenseCents: kpis.totalExpenseCents } }, categories, offenders, insights: [],
  };
  return renderToStaticMarkup(createElement(DashboardShell, { user: { name: "Synthetic", email: "synthetic@example.test" }, activeFilter: "current-month", summary }));
}

describe("dashboard period states and preserved sections", () => {
  it("distinguishes excluded movement from an empty period and preserves recent transactions", () => {
    const html = shell([transaction("transfer", { direction: "TRANSFER" }), transaction("reversal", { direction: "REVERSAL" })]);
    expect(html).toContain("Há movimentações neste período");
    expect(html).toContain("Últimas transações");
    expect(html).toContain("Não há saídas neste período");
    expect(html).not.toContain("O periodo selecionado nao tem transacoes importadas");
  });
  it("keeps first use separate from an empty period", () => {
    expect(shell([], false)).toContain("Importe um CSV ficticio");
    expect(shell([])).toContain("O periodo selecionado nao tem transacoes importadas");
  });
  it("preserves the category ranking, evolution table and section order", () => {
    const html = shell([transaction("one")]);
    expect(html).toContain("Onde o dinheiro foi usado");
    expect(html).toContain("Consultar dados da evolução em tabela");
    expect(html.indexOf("Principais gastos do período")).toBeGreaterThan(html.indexOf("Onde o dinheiro foi usado"));
    expect(html.indexOf("Principais gastos do período")).toBeLessThan(html.indexOf("Leituras contextuais"));
    expect(shell([transaction("zero", { amountCents: 0 })])).toContain("Não há valor de saída para compor este gráfico");
  });
});
