import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  return <DashboardShell user={user} />;
}
