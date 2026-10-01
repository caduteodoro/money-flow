import Link from "next/link";
import type { DashboardDateFilterId } from "@/lib/dashboard/dashboard-types";
import { expenseFlowHref, type ExpenseFlowModel } from "@/lib/dashboard/expense-flow";
import { buildExpenseFlowGraph } from "@/lib/dashboard/expense-flow-visualization";
import { formatDashboardCurrency as currency, formatDashboardPercentage as percent } from "@/lib/dashboard/dashboard-visualization";
import { ExpenseFlowClient } from "./expense-flow-client";

const linkStyle = "inline-flex min-h-11 items-center rounded py-2 text-sm font-bold text-brand-teal underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal";

export function ExpenseFlow({ model, period }: { model: ExpenseFlowModel; period: DashboardDateFilterId }) {
  return (
    <section aria-labelledby="expense-flow-title" className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <h2 id="expense-flow-title" className="text-xl font-bold text-brand-navy">Como os gastos se distribuem?</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Fluxo das saídas entre categorias e principais descrições do período.</p>
      {model.totalExpenseCents === 0 ? <p className="mt-4 text-sm text-slate-600">Não há saídas com valor positivo para compor este fluxo.</p> : (
        <>
          <p className="mt-3 text-sm leading-6 text-slate-600">Saídas representadas: <strong className="tabular-nums text-brand-navy">{currency(model.totalExpenseCents)}</strong>. Categorias filhas são consolidadas na raiz. Esta distribuição não representa saldo bancário nem transferências entre contas.</p>
          <div className="mt-4"><ExpenseFlowClient graph={buildExpenseFlowGraph(model)} /></div>
          <p className="text-sm leading-6 text-slate-600 md:hidden">Use o ranking de categorias acima ou consulte a distribuição em texto abaixo.</p>
          <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50">
            <summary className="min-h-11 cursor-pointer rounded px-4 py-3 text-sm font-bold text-brand-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal">Consultar distribuição das saídas em texto</summary>
            <div className="space-y-4 px-4 pb-4">
              <p className="text-sm leading-6 text-slate-600">“Outros” reúne categorias excedentes. Este fluxo mostra até cinco ramos, então “Outros” pode reunir mais categorias que no ranking acima; o total de saídas permanece o mesmo. “Outras descrições” reúne descrições excedentes de um ramo. “Sem categoria” preserva saídas não categorizadas. Descrições normalizadas ausentes aparecem como “Descrição não identificada”.</p>
              <ul className="space-y-4">
                {model.categories.map(category => {
                  const href = expenseFlowHref(category, period);
                  return <li key={category.id} className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 [overflow-wrap:anywhere]">
                    <h3 className="font-bold text-brand-navy">{category.label}</h3>
                    <p className="mt-1 text-sm tabular-nums text-slate-700">{currency(category.amountCents)} · {percent(category.percentage)} das saídas</p>
                    {href ? <Link href={href} className={linkStyle}>Ver saídas desta categoria</Link> : <p className="mt-2 text-xs text-slate-600">Grupo sem consulta exata disponível.</p>}
                    <ul className="mt-2 divide-y divide-slate-100">
                      {category.descriptions.map(description => {
                        const target = expenseFlowHref(category, period, description);
                        return <li key={description.id} className="py-3">
                          <p className="text-sm font-semibold text-slate-700">{description.label}</p>
                          <p className="mt-1 text-sm tabular-nums text-slate-600">{currency(description.amountCents)} · {percent(description.percentage)} das saídas · {percent(description.categoryPercentage)} deste ramo</p>
                          {target ? <Link href={target} className={linkStyle}>Ver saídas desta descrição nesta categoria</Link> : <p className="mt-1 text-xs text-slate-500">Grupo sem consulta exata disponível.</p>}
                        </li>;
                      })}
                    </ul>
                  </li>;
                })}
              </ul>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
