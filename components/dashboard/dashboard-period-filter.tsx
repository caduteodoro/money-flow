import Link from "next/link";
import type { DashboardDateFilterId } from "@/lib/dashboard/dashboard-types";

type DashboardPeriodFilterProps = {
  activeFilter: DashboardDateFilterId;
};

const filters: { id: DashboardDateFilterId; label: string }[] = [
  { id: "imported-period", label: "Todo o período" },
  { id: "last-30-days", label: "Últimos 30 dias" },
  { id: "current-month", label: "Mês atual" },
  { id: "previous-month", label: "Mês anterior" },
];

export function DashboardPeriodFilter({ activeFilter }: DashboardPeriodFilterProps) {
  return (
    <nav
      className="grid w-full grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 sm:grid-cols-4"
      aria-label="Filtros de periodo do dashboard"
    >
      {filters.map((filter) => {
        const active = filter.id === activeFilter;

        return (
          <Link
            key={filter.id}
            className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3 text-center text-sm font-semibold leading-5 transition ${
              active
                ? "border-brand-teal bg-white text-brand-teal shadow-sm"
                : "border-transparent text-slate-600 hover:bg-white hover:text-brand-teal"
            }`}
            href={`/dashboard?period=${filter.id}`}
          >
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}
