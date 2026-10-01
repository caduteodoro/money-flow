import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
      className="grid w-full grid-cols-2 gap-2 rounded-xl border bg-muted p-1.5 sm:grid-cols-4"
      aria-label="Filtros de periodo do dashboard"
    >
      {filters.map((filter) => {
        const active = filter.id === activeFilter;

        return (
          <Link
            key={filter.id}
            aria-current={active ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: active ? "default" : "ghost", size: "sm" }),
              "h-auto min-h-10 text-center leading-5"
            )}
            href={`/dashboard?period=${filter.id}`}
          >
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}
