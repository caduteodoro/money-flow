import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExpenseFlow } from "@/components/dashboard/expense-flow";
import { buildExpenseFlow, expenseFlowHref, EXPENSE_FLOW_LIMITS } from "@/lib/dashboard/expense-flow";
import { buildExpenseFlowGraph, buildExpenseFlowOption } from "@/lib/dashboard/expense-flow-visualization";
import { calculateFinancialKpis } from "@/lib/dashboard/dashboard-calculations";
import { parseTransactionFilters } from "@/lib/transactions/transaction-filters";
import type { DashboardAnalyticsTransaction } from "@/lib/dashboard/dashboard-types";

function row(id: string, changes: Partial<DashboardAnalyticsTransaction> = {}): DashboardAnalyticsTransaction {
  return { id, occurredAt: new Date("2026-08-01T00:00:00Z"), direction: "EXPENSE", amountCents: -100,
    description: "Synthetic raw", normalizedDescription: "Synthetic description", descriptionHash: "a".repeat(64),
    category: { id: "root-a", name: "Synthetic A", parent: null }, categoryId: "root-a", categorizationSource: "USER_MANUAL", ...changes };
}
function assertConservation(rows: DashboardAnalyticsTransaction[]) {
  const model = buildExpenseFlow(rows);
  expect(model.categories.reduce((sum, category) => sum + category.amountCents, 0)).toBe(model.totalExpenseCents);
  for (const category of model.categories) expect(category.descriptions.reduce((sum, leaf) => sum + leaf.amountCents, 0)).toBe(category.amountCents);
  const graph = buildExpenseFlowGraph(model);
  expect(graph.links.filter(link => link.source === "expense-total").reduce((sum, link) => sum + link.value, 0)).toBe(model.totalExpenseCents);
  expect(graph.nodes.filter(node => node.depth === 2).reduce((sum, node) => sum + node.amountCents, 0)).toBe(model.totalExpenseCents);
  return model;
}

describe("expense flow analytical contract", () => {
  it("creates the root and reconciles signed expenses, child categories and percentages without mutation", () => {
    const rows = [row("a"), row("b", { amountCents: 300, category: { id: "child", name: "Synthetic child", parent: { id: "root-a", name: "Synthetic A" } } }), row("c", { amountCents: -100, category: null, categoryId: null })];
    const before = structuredClone(rows);
    const model = assertConservation(rows);
    expect(rows).toEqual(before);
    expect(model.totalExpenseCents).toBe(calculateFinancialKpis(rows).totalExpenseCents);
    expect(model.categories.map(category => category.percentage)).toEqual([80, 20]);
    expect(model.categories[0].descriptions[0].categoryPercentage).toBe(100);
    expect(buildExpenseFlowGraph(model).nodes[0]).toMatchObject({ id: "expense-total", amountCents: 500, depth: 0 });
  });
  it.each(["INCOME", "TRANSFER", "REVERSAL"] as const)("excludes %s", direction => {
    expect(buildExpenseFlow([row("excluded", { direction })])).toEqual({ totalExpenseCents: 0, categories: [] });
  });
  it.each([0, NaN, Infinity, -Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1])("excludes non-drawable amount %s", amountCents => {
    expect(buildExpenseFlow([row("invalid", { amountCents })]).totalExpenseCents).toBe(0);
  });
  it("fails loudly on total overflow instead of rendering an empty panel", () => {
    expect(() => buildExpenseFlow([row("a", { amountCents: Number.MAX_SAFE_INTEGER }), row("b")])).toThrow("intervalo seguro");
  });
  it("keeps uncategorized and unidentified, blank and hash-only groups", () => {
    const rows = [row("a", { category: null, categoryId: null, normalizedDescription: null, descriptionHash: null }),
      row("b", { category: null, categoryId: null, normalizedDescription: " \t", descriptionHash: "invalid" }),
      row("c", { category: null, categoryId: null, normalizedDescription: null })];
    const model = assertConservation(rows);
    expect(model.categories[0].label).toBe("Sem categoria");
    expect(model.categories[0].descriptions.map(leaf => leaf.amountCents)).toEqual([200, 100]);
    expect(model.categories[0].descriptions.every(leaf => leaf.label === "Descrição não identificada")).toBe(true);
  });
  it("shares the 4A identity without merging hashless, hashed or different-category groups", () => {
    const rows = [row("a", { normalizedDescription: " ＣＡＦÉ\tSintético ", descriptionHash: null }),
      row("b", { normalizedDescription: "café sintético", descriptionHash: null }), row("c", { normalizedDescription: "café sintético" }),
      row("d", { normalizedDescription: "café sintético", categoryId: "root-b", category: { id: "root-b", name: "Synthetic B", parent: null } })];
    const model = assertConservation(rows);
    expect(model.categories).toHaveLength(2);
    expect(model.categories[0].descriptions.map(leaf => leaf.amountCents)).toEqual([200, 100]);
    const ids = buildExpenseFlowGraph(model).nodes.map(node => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.join(" ")).not.toMatch(/café|ＣＡＦÉ|Synthetic/);
    expect(buildExpenseFlow([...rows].reverse())).toEqual(model);
  });
  it("selects actual text over an absent label in the same hash group", () => {
    const rows = [row("a", { normalizedDescription: null }), row("b", { normalizedDescription: "Zulu synthetic" })];
    expect(buildExpenseFlow(rows).categories[0].descriptions[0].label).toBe("Zulu synthetic");
    expect(buildExpenseFlow([...rows].reverse())).toEqual(buildExpenseFlow(rows));
  });
  it("bounds both residual levels, keeps Sem categoria and conserves every cent at scale", () => {
    const rows = Array.from({ length: 240 }, (_, i) => row(`row-${i}`, {
      categoryId: `category-${i % 12}`, category: { id: `category-${i % 12}`, name: `Synthetic ${i % 12}`, parent: null },
      descriptionHash: null, normalizedDescription: `Synthetic description ${i}`, amountCents: -(i + 1),
    }));
    rows.push(row("uncategorized", { category: null, categoryId: null, amountCents: -1 }));
    const model = assertConservation(rows); const graph = buildExpenseFlowGraph(model);
    expect(model.categories).toHaveLength(5);
    expect(model.categories.some(category => category.kind === "UNCATEGORIZED")).toBe(true);
    expect(model.categories.some(category => category.kind === "OTHER")).toBe(true);
    expect(model.categories.every(category => category.descriptions.length <= 4)).toBe(true);
    expect(graph.nodes.length).toBeLessThanOrEqual(EXPENSE_FLOW_LIMITS.nodes);
    expect(graph.links.length).toBeLessThanOrEqual(EXPENSE_FLOW_LIMITS.links);
    expect(graph.links.every(link => link.value > 0)).toBe(true);
    expect(buildExpenseFlow([...rows].reverse())).toEqual(model);
  });
  it("does not merge identical descriptions across categories inside Outros", () => {
    const rows = Array.from({ length: 7 }, (_, i) => row(`r${i}`, { amountCents: -(100 - i),
      category: { id: `c${i}`, name: `Synthetic ${i}`, parent: null }, categoryId: `c${i}` }));
    const other = assertConservation(rows).categories.find(category => category.kind === "OTHER")!;
    expect(other.descriptions).toHaveLength(3);
    expect(new Set(other.descriptions.map(leaf => leaf.id)).size).toBe(3);
    expect(other.descriptions.every(leaf => expenseFlowHref(other, "current-month", leaf) === null)).toBe(true);
  });
  it("generates exact combined filters, no financial URL text and fresh pagination", () => {
    const category = buildExpenseFlow([row("a")]).categories[0];
    const url = expenseFlowHref(category, "previous-month", category.descriptions[0])!;
    const result = parseTransactionFilters(Object.fromEntries(new URLSearchParams(url.split("?")[1])));
    expect(result).toMatchObject({ ok: true, filters: { categoryId: "root-a", direction: "EXPENSE", period: "previous-month", page: 1 } });
    expect(url).not.toMatch(/Synthetic|normalizedDescription|page=/);
    const uncategorized = buildExpenseFlow([row("a", { category: null, categoryId: null })]).categories[0];
    expect(expenseFlowHref(uncategorized, "current-month", uncategorized.descriptions[0])).toContain("filter=uncategorized");
    const hashless = buildExpenseFlow([row("a", { descriptionHash: null })]).categories[0];
    expect(expenseFlowHref(hashless, "current-month", hashless.descriptions[0])).toBeNull();
  });
  it("does not link a positive flow to a list that also contains omitted zero-value expenses", () => {
    const category = buildExpenseFlow([row("positive"), row("zero", { amountCents: 0 })]).categories[0];
    expect(category.amountCents).toBe(100);
    expect(expenseFlowHref(category, "current-month")).toBeNull();
    expect(expenseFlowHref(category, "current-month", category.descriptions[0])).toBeNull();
  });
  it("caps the synthetic chart payload with maximum branches and long labels", () => {
    const rows = Array.from({ length: 200 }, (_, i) => row(`synthetic-${i}`, {
      amountCents: -1, descriptionHash: null, normalizedDescription: `${i}-${"Synthetic ".repeat(40)}`,
      category: i % 10 === 0 ? null : { id: `c${i % 10}`, name: "Synthetic ".repeat(40), parent: null },
      categoryId: i % 10 === 0 ? null : `c${i % 10}`,
    }));
    const graph = buildExpenseFlowGraph(assertConservation(rows));
    expect(graph.nodes).toHaveLength(26); expect(graph.links).toHaveLength(25);
    expect(Buffer.byteLength(JSON.stringify(graph), "utf8")).toBeLessThan(16000);
    expect(graph.nodes.every(node => node.label.length <= 160)).toBe(true);
  });
});

describe("expense flow accessible component and real ECharts spike", () => {
  it("renders neutral empty state without mounting a graph or a blank ranking", () => {
    const html = renderToStaticMarkup(createElement(ExpenseFlow, { model: buildExpenseFlow([]), period: "current-month" }));
    expect(html).toContain("Não há saídas com valor positivo");
    expect(html).not.toContain("Carregando");
    expect(html).not.toContain("<ul");
  });
  it("renders complete escaped text, residual explanations, accessible links and mobile fallback", () => {
    const label = `<script>Synthetic</script>${"Long".repeat(100)}`;
    const model = buildExpenseFlow([row("one", { normalizedDescription: label })]);
    const html = renderToStaticMarkup(createElement(ExpenseFlow, { model, period: "current-month" }));
    expect(html).toContain("Como os gastos se distribuem?");
    expect(html).toContain("Consultar distribuição das saídas em texto");
    expect(html).toContain("ranking de categorias acima");
    expect(html).toContain("hidden min-w-0 md:block");
    expect(html).toContain("aria-hidden=\"true\"");
    expect(html).toContain("&lt;script&gt;Synthetic&lt;/script&gt;" + "Long".repeat(100));
    expect(html).not.toContain("<script>");
    expect(html).toContain("Outras descrições");
    expect(html).toContain("o total de saídas permanece o mesmo");
    expect(html).toContain("focus-visible:outline");
    expect(html).toContain("descriptionHash=");
    expect(html).not.toContain("<table");
  });
  it("renders bounded synthetic SVG with installed modules and mouse/touch tooltip options", async () => {
    const { init, use } = await import("echarts/core");
    const { SankeyChart } = await import("echarts/charts");
    const { SVGRenderer } = await import("echarts/renderers");
    const { LabelLayout } = await import("echarts/features");
    use([SankeyChart, SVGRenderer, LabelLayout]);
    const graph = buildExpenseFlowGraph(buildExpenseFlow([row("a")]));
    const option = buildExpenseFlowOption(graph);
    expect(option).toMatchObject({ animation: false, tooltip: { triggerOn: "mousemove|click", renderMode: "richText", confine: true } });
    const tooltip = option.tooltip as { formatter: (params: { dataType?: string; dataIndex: number }) => string };
    expect(tooltip.formatter({ dataIndex: 2 })).toContain("100% deste ramo de categoria");
    expect(tooltip.formatter({ dataType: "edge", dataIndex: 0 })).toContain("100% das saídas");
    expect(JSON.stringify(graph)).not.toContain("descriptionHash");
    const chart = init(null, undefined, { renderer: "svg", ssr: true, width: 900, height: 400 });
    try { chart.setOption({ ...option, tooltip: undefined }); expect(chart.renderToSVGString()).toContain("<path"); }
    finally { chart.dispose(); }
    expect(chart.isDisposed()).toBe(true);
  });
});
