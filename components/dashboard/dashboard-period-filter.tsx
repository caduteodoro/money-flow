import Link from "next/link";
import type { DashboardDateFilterId } from "@/lib/dashboard/dashboard-types";

type DashboardPeriodFilterProps = {
  activeFilter: DashboardDateFilterId;
};

const filters: { id: DashboardDateFilterId; label: string }[] = [
  { id: "imported-period", label: "Periodo importado" },
  { id: "last-30-days", label: "Ultimos 30 dias" },
  { id: "current-month", label: "Mes atual" },
  { id: "previous-month", label: "Mes anterior" },
];

export function DashboardPeriodFilter({ activeFilter }: DashboardPeriodFilterProps) {
  return (
    <nav
      className="flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 xl:w-auto"
      aria-label="Filtros de periodo do dashboard"
    >
      {filters.map((filter) => {
        const active = filter.id === activeFilter;

        return (
          <Link
            key={filter.id}
            className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition xl:flex-none ${
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
