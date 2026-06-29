import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getDashboardSummary } from "@/lib/dashboard/dashboard-service";
import type { DashboardDateFilterId } from "@/lib/dashboard/dashboard-types";

type DashboardPageProps = {
  searchParams?: Promise<{
    period?: string;
  }>;
};

const dashboardDateFilters = new Set<DashboardDateFilterId>([
  "imported-period",
  "last-30-days",
  "current-month",
  "previous-month",
]);

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireCurrentUser();
  const resolvedSearchParams = await searchParams;
  const activeFilter = parseDashboardDateFilter(resolvedSearchParams?.period);
  const summary = await getDashboardSummary({
    userId: user.id,
    dateFilter: activeFilter,
  });

  return <DashboardShell activeFilter={activeFilter} summary={summary} user={user} />;
}

function parseDashboardDateFilter(value: string | undefined): DashboardDateFilterId {
  if (value && dashboardDateFilters.has(value as DashboardDateFilterId)) {
    return value as DashboardDateFilterId;
  }

  return "imported-period";
}
