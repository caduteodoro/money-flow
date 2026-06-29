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
    <nav className="flex flex-wrap gap-2" aria-label="Filtros de periodo do dashboard">
      {filters.map((filter) => {
        const active = filter.id === activeFilter;

        return (
          <Link
            key={filter.id}
            className={`inline-flex min-h-10 items-center rounded-md border px-3 text-sm font-semibold transition ${
              active
                ? "border-brand-teal bg-teal-50 text-brand-teal"
                : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-brand-teal"
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
