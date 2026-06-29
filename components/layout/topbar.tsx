import { CalendarDays, LogOut } from "lucide-react";
import { logoutAction } from "@/app/logout/actions";

type TopbarProps = {
  user: {
    email: string;
  };
  eyebrow?: string;
  title?: string;
  periodLabel?: string;
};

export function Topbar({
  user,
  eyebrow = "Visao geral",
  title = "Dashboard financeiro",
  periodLabel = "Periodo",
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-teal">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-navy">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-4 text-sm font-semibold text-brand-teal"
          type="button"
        >
          <CalendarDays className="size-4" aria-hidden="true" />
          {periodLabel}
        </button>
        <form action={logoutAction}>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-brand-navy transition hover:border-teal-200 hover:bg-teal-50">
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
