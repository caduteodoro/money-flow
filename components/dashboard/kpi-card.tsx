import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardMetricComparison } from "@/lib/dashboard/dashboard-types";

type KpiCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  comparison: DashboardMetricComparison;
  favorableDirection: "up" | "down" | "neutral";
  actionHref?: string;
  actionLabel?: string;
};

export function KpiCard({
  label,
  value,
  helper,
  icon,
  comparison,
  favorableDirection,
  actionHref,
  actionLabel,
}: KpiCardProps) {
  const comparisonView = formatComparison(comparison, favorableDirection);

  return (
    <Card className="min-w-0 transition-transform hover:-translate-y-0.5">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <CardTitle className="break-words text-[clamp(1.35rem,2.2vw,1.8rem)] tabular-nums">{value}</CardTitle>
        <CardDescription className="min-h-10 leading-5">{helper}</CardDescription>
        <CardAction>
          <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">{icon}</span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-2">
        <Badge variant={comparisonView.variant}>
          {comparisonView.icon}
          {comparisonView.label}
        </Badge>
        {actionHref && actionLabel ? (
          <LinkButton href={actionHref} size="sm" variant="link">{actionLabel}</LinkButton>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatComparison(
  comparison: DashboardMetricComparison,
  favorableDirection: "up" | "down" | "neutral",
) {
  if (comparison.comparisonStatus === "NO_BASIS" || comparison.percentageChange === null) {
    return {
      label: "Sem base comparável",
      variant: "outline" as const,
      icon: <Minus data-icon="inline-start" aria-hidden="true" />,
    };
  }

  if (comparison.comparisonStatus === "UNCHANGED") {
    return {
      label: "Sem variação",
      variant: "outline" as const,
      icon: <Minus data-icon="inline-start" aria-hidden="true" />,
    };
  }

  const increased = comparison.comparisonStatus === "INCREASE";
  const favorable =
    favorableDirection === "neutral" ||
    (favorableDirection === "up" && increased) ||
    (favorableDirection === "down" && !increased);
  const percentage = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(
    Math.abs(comparison.percentageChange),
  );

  return {
    label: `${increased ? "Aumento" : "Redução"} de ${percentage}%`,
    variant: favorable ? ("secondary" as const) : ("destructive" as const),
    icon: increased ? (
      <ArrowUpRight data-icon="inline-start" aria-hidden="true" />
    ) : (
      <ArrowDownRight data-icon="inline-start" aria-hidden="true" />
    ),
  };
}
