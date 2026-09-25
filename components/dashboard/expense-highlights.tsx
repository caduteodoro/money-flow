import Link from "next/link";
import type { ReactNode } from "react";

import type { DashboardDateFilterId, DashboardOffenders } from "@/lib/dashboard/dashboard-types";
import { UNIDENTIFIED_DESCRIPTION_LABEL } from "@/lib/dashboard/description-groups";
import { formatDashboardCurrency, formatDashboardPercentage } from "@/lib/dashboard/dashboard-visualization";
import { buildDashboardDrillThroughUrl } from "@/lib/transactions/transaction-filters";

type ExpenseHighlightsProps = {
  offenders: DashboardOffenders;
  period: DashboardDateFilterId;
  totalExpenseCents: number;
  expenseCount: number;
};

export function ExpenseHighlights({ offenders, period, totalExpenseCents, expenseCount }: ExpenseHighlightsProps) {
  return (
    <section aria-labelledby="expense-highlights-title" className="min-w-0 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-brand-navy" id="expense-highlights-title">Principais gastos do período</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Três leituras das saídas no período selecionado. Cada ranking mostra até cinco itens e pode representar apenas parte do total.
        </p>
      </div>
      {expenseCount === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">
          Não há saídas neste período para compor os rankings.
        </p>
      ) : (
        <>
          {totalExpenseCents === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
              As saídas deste período têm valor zero. As transações continuam disponíveis; os percentuais estão sem base.
            </p>
          ) : null}
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <RankingPanel className="md:col-span-2 2xl:col-span-1" id="expense-descriptions-title" title="Quais descrições mais pesaram?">
              {offenders.topNormalizedDescriptions.map((item, index) => (
                <RankingItem key={item.key} position={index + 1}>
                  <Description text={item.label} />
                  <Amount amountCents={item.amountCents} totalExpenseCents={totalExpenseCents} />
                  <Count value={item.transactionCount} />
                  <RankingAction href={buildDashboardDrillThroughUrl(item.target, period)}>
                    Ver saídas desta descrição
                  </RankingAction>
                </RankingItem>
              ))}
            </RankingPanel>
            <RankingPanel id="largest-expenses-title" title="Quais foram as maiores saídas?">
              {offenders.largestExpenses.map((item, index) => (
                <RankingItem key={item.id} position={index + 1}>
                  <DateLabel value={item.occurredAt} />
                  <Description text={item.description} />
                  <Amount amountCents={item.amountCents} />
                  <RankingAction href={buildDashboardDrillThroughUrl(item.target, period)}>
                    Localizar transação
                  </RankingAction>
                </RankingItem>
              ))}
            </RankingPanel>
            <RankingPanel id="expense-days-title" title="Em quais dias você mais gastou?">
              {offenders.topExpenseDays.map((item, index) => (
                <RankingItem key={item.date} position={index + 1}>
                  <DateLabel value={item.date} />
                  <Amount amountCents={item.amountCents} totalExpenseCents={totalExpenseCents} />
                  <Count value={item.transactionCount} />
                  <RankingAction href={buildDashboardDrillThroughUrl(item.target, period)}>
                    Ver saídas deste dia
                  </RankingAction>
                </RankingItem>
              ))}
            </RankingPanel>
          </div>
        </>
      )}
    </section>
  );
}

function RankingPanel({ id, title, children, className = "" }: {
  id: string; title: string; children: ReactNode; className?: string;
}) {
  return (
    <section aria-labelledby={id} className={`min-w-0 rounded-xl border border-slate-200 bg-white shadow-soft ${className}`}>
      <h3 className="border-b border-slate-100 px-5 py-4 text-base font-bold text-brand-navy" id={id}>{title}</h3>
      <ol className="divide-y divide-slate-100 px-5">{children}</ol>
    </section>
  );
}

function RankingItem({ position, children }: { position: number; children: ReactNode }) {
  return (
    <li className="flex min-w-0 gap-3 py-4">
      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{position}</span>
      <div className="min-w-0 flex-1 space-y-1 [overflow-wrap:anywhere]">{children}</div>
    </li>
  );
}

function Description({ text }: { text: string }) {
  const label = text.trim() || UNIDENTIFIED_DESCRIPTION_LABEL;
  return (
    <details className="group">
      <summary className="min-h-11 cursor-pointer rounded py-2 text-sm font-bold text-brand-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal">
        <span className="line-clamp-2 group-open:line-clamp-none">{label}</span>
        <span className="mt-1 block text-xs font-normal text-slate-500 group-open:hidden">Expandir descrição</span>
        <span className="mt-1 hidden text-xs font-normal text-slate-500 group-open:block">Recolher descrição</span>
      </summary>
    </details>
  );
}

function Amount({ amountCents, totalExpenseCents }: { amountCents: number; totalExpenseCents?: number }) {
  return (
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="min-w-0 text-base font-bold tabular-nums text-brand-navy">{formatDashboardCurrency(amountCents)}</span>
      {totalExpenseCents !== undefined ? (
        <span className="text-xs text-slate-600">
          {totalExpenseCents > 0 ? `${formatDashboardPercentage(amountCents / totalExpenseCents * 100)} das saídas` : "Percentual sem base"}
        </span>
      ) : null}
    </div>
  );
}

function DateLabel({ value }: { value: string }) {
  const date = value.slice(0, 10);
  return <time className="block text-sm font-semibold text-slate-600" dateTime={date}>{new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`))}</time>;
}

function Count({ value }: { value: number }) {
  return <p className="text-xs text-slate-600">{value} {value === 1 ? "transação" : "transações"}</p>;
}

function RankingAction({ href, children }: { href: string | null; children: ReactNode }) {
  return href ? (
    <Link className="inline-flex min-h-11 items-center rounded py-2 text-sm font-bold text-brand-teal underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal" href={href}>
      {children}
    </Link>
  ) : <p className="pt-2 text-xs leading-5 text-slate-500">Consulta exata indisponível para este grupo.</p>;
}
