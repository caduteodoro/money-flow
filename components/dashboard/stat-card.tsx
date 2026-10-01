import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = { label: string; value: string; helper: string; icon: ReactNode; accent: string };

export function StatCard({ label, value, helper, icon, accent }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
          <span className={`grid size-10 place-items-center rounded-lg ${accent}`}>{icon}</span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
