import type { EChartsCoreOption } from "echarts/core";
import type { ExpenseFlowModel } from "./expense-flow";
import { formatDashboardCurrency as currency, formatDashboardPercentage as percent } from "./dashboard-visualization";

export type ExpenseFlowNode = {
  id: string; label: string; amountCents: number; percentage: number; categoryPercentage?: number;
  depth: number; note: string; color: string;
};
export type ExpenseFlowGraph = { nodes: ExpenseFlowNode[]; links: { source: string; target: string; value: number }[] };

// Server projection: no transactions, navigation references or description hashes go to the chart.
export function buildExpenseFlowGraph(model: ExpenseFlowModel): ExpenseFlowGraph {
  if (!model.totalExpenseCents) return { nodes: [], links: [] };
  const nodes: ExpenseFlowNode[] = [{ id: "expense-total", label: "Saídas totais", amountCents: model.totalExpenseCents,
    percentage: 100, depth: 0, note: "Distribuição analítica; não representa saldo bancário.", color: "#102a43" }];
  const links: ExpenseFlowGraph["links"] = [];
  for (const category of model.categories) {
    const color = category.kind === "UNCATEGORIZED" ? "#b45309" : category.kind === "OTHER" ? "#64748b" : "#0f766e";
    nodes.push({ id: category.id, label: category.label.slice(0, 160), amountCents: category.amountCents,
      percentage: category.percentage, depth: 1, color, note: category.kind === "OTHER" ? "Categorias excedentes agrupadas."
        : category.kind === "UNCATEGORIZED" ? "Saídas sem categoria atribuída." : "Categoria raiz, incluindo suas filhas." });
    links.push({ source: "expense-total", target: category.id, value: category.amountCents });
    for (const description of category.descriptions) {
      nodes.push({ id: description.id, label: description.label.slice(0, 160), amountCents: description.amountCents,
        percentage: description.percentage, categoryPercentage: description.categoryPercentage, depth: 2, color,
        note: description.kind === "OTHER_DESCRIPTIONS" ? "Descrições excedentes deste ramo agrupadas."
          : description.label === "Descrição não identificada" ? "Descrição normalizada ausente."
            : "Descrição deste ramo; não identifica um estabelecimento." });
      links.push({ source: category.id, target: description.id, value: description.amountCents });
    }
  }
  return { nodes, links };
}

export function expenseFlowHeight(graph: ExpenseFlowGraph) {
  return Math.max(280, graph.nodes.filter(node => node.depth === 2).length * 28 + 48);
}

export function buildExpenseFlowOption(graph: ExpenseFlowGraph): EChartsCoreOption {
  const tooltip = (params: { dataType?: string; dataIndex?: number }) => {
    const index = params.dataIndex ?? -1;
    const node = params.dataType === "edge" ? graph.nodes.find(node => node.id === graph.links[index]?.target) : graph.nodes[index];
    if (!node) return "";
    // richText renders SVG text, never financial strings as HTML. Wrap long labels within the chart.
    const label = Array.from(node.label).join("").match(/.{1,32}/gu)?.join("\n") ?? "";
    return `${label}\n${currency(node.amountCents)} · ${percent(node.percentage)} das saídas` +
      (node.categoryPercentage !== undefined ? `\n${percent(node.categoryPercentage)} deste ramo de categoria` : "") + `\n${node.note}`;
  };
  return {
    animation: false,
    textStyle: { fontFamily: "Arial, sans-serif" },
    tooltip: { trigger: "item", triggerOn: "mousemove|click", renderMode: "richText", confine: true, formatter: tooltip,
      textStyle: { fontSize: 12, width: 310, overflow: "break" } },
    series: [{ type: "sankey", left: 12, right: 150, top: 24, bottom: 24, nodeWidth: 14, nodeGap: 16,
      nodeAlign: "justify", layoutIterations: 0, draggable: false, roam: false,
      data: graph.nodes.map(node => ({ name: node.id, value: node.amountCents, depth: node.depth, itemStyle: { color: node.color } })),
      links: graph.links, lineStyle: { color: "source", opacity: 0.22, curveness: 0.45 },
      label: { color: "#334155", fontSize: 12, width: 130, overflow: "truncate",
        formatter: (params: { dataIndex?: number }) => graph.nodes[params.dataIndex ?? -1]?.label ?? "" },
      labelLayout: { hideOverlap: true }, emphasis: { focus: "adjacency", lineStyle: { opacity: 0.45 } },
    }],
  };
}
