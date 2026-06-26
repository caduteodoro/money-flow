import { CalendarDays } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
      <div>
        <p className="text-sm font-medium text-brand-teal">Visão geral</p>
        <h1 className="text-2xl font-bold text-brand-navy">Dashboard financeiro</h1>
      </div>

      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-brand-navy transition hover:border-teal-200 hover:bg-teal-50">
        <CalendarDays className="size-4" aria-hidden="true" />
        Abril 2026
      </button>
    </header>
  );
}
