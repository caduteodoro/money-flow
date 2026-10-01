"use client";

import { useEffect, useRef, useState } from "react";
import { buildExpenseFlowOption, expenseFlowHeight, type ExpenseFlowGraph } from "@/lib/dashboard/expense-flow-visualization";
import { mountExpenseFlow, type ExpenseFlowStatus } from "./expense-flow-lifecycle";

export function ExpenseFlowClient({ graph }: { graph: ExpenseFlowGraph }) {
  const container = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ExpenseFlowStatus>("loading");
  useEffect(() => {
    if (!container.current || !surface.current) return;
    return mountExpenseFlow(container.current, surface.current, buildExpenseFlowOption(graph), setStatus);
  }, [graph]);
  return (
    <div ref={container} className="hidden min-w-0 md:block">
      <div className={status === "compact" || status === "error" ? "hidden" : "relative"}>
        <div ref={surface} aria-hidden="true" className={status === "ready" ? "w-full" : "invisible w-full"} style={{ height: expenseFlowHeight(graph) }} />
        {status === "loading" ? <p role="status" className="absolute inset-0 grid place-items-center rounded-xl bg-slate-50 text-sm text-slate-600">Carregando fluxo das saídas…</p> : null}
      </div>
      {status === "error" ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Não foi possível carregar o gráfico. Consulte a distribuição em texto abaixo.</p> : null}
      {status === "compact" ? <p className="text-sm text-slate-600">O ranking de categorias acima resume as saídas. A distribuição detalhada está disponível em texto abaixo.</p> : null}
    </div>
  );
}
