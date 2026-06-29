import type { ReactNode } from "react";

type KpiCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  accent: string;
};

export function KpiCard({ label, value, helper, icon, accent }: KpiCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 break-words text-2xl font-bold text-brand-navy">{value}</p>
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-md ${accent}`}>
          {icon}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{helper}</p>
    </section>
  );
}
