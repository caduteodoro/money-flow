import type { ReactNode } from "react";
import Link from "next/link";

type KpiCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  accent: string;
  actionHref?: string;
  actionLabel?: string;
};

export function KpiCard({ label, value, helper, icon, accent, actionHref, actionLabel }: KpiCardProps) {
  return (
    <section className="group min-w-0 rounded-xl border border-slate-200/80 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-[0_20px_50px_rgba(15,23,42,0.10)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-500" title={label}>
            {label}
          </p>
          <p className="mt-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xl font-bold tabular-nums text-brand-navy min-[420px]:text-2xl">
            {value}
          </p>
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${accent}`}>
          {icon}
        </span>
      </div>
      <p className="mt-4 min-h-10 overflow-hidden text-ellipsis text-sm leading-5 text-slate-500">{helper}</p>
      {actionHref && actionLabel ? (
        <Link
          className="mt-3 inline-flex min-h-10 items-center rounded-md text-sm font-bold text-brand-teal underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
