import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getDashboardSummary } from "@/lib/dashboard/dashboard-service";
import { parseDashboardDateFilter } from "@/lib/dashboard/date-filters";

type DashboardPageProps = {
  searchParams?: Promise<{
    period?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireCurrentUser();
  const resolvedSearchParams = await searchParams;
  const parsedFilter = parseDashboardDateFilter(resolvedSearchParams?.period);

  if (!parsedFilter.ok) {
    notFound();
  }

  const activeFilter = parsedFilter.filter;
  const summary = await getDashboardSummary({
    userId: user.id,
    dateFilter: activeFilter,
  });

  return <DashboardShell activeFilter={activeFilter} summary={summary} user={user} />;
}
