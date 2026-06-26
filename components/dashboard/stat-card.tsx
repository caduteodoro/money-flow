import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  accent: string;
};

export function StatCard({ label, value, helper, icon, accent }: StatCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-bold text-brand-navy">{value}</p>
        </div>
        <span className={`grid size-10 place-items-center rounded-md ${accent}`}>{icon}</span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{helper}</p>
    </section>
  );
}
