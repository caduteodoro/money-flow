import { CalendarDays, LogOut } from "lucide-react";
import { logoutAction } from "@/app/logout/actions";

type TopbarProps = {
  user: {
    email: string;
  };
  eyebrow?: string;
  title?: string;
};

export function Topbar({ user, eyebrow = "Visao geral", title = "Dashboard financeiro" }: TopbarProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
      <div>
        <p className="text-sm font-medium text-brand-teal">{eyebrow}</p>
        <h1 className="text-2xl font-bold text-brand-navy">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-brand-navy transition hover:border-teal-200 hover:bg-teal-50"
          type="button"
        >
          <CalendarDays className="size-4" aria-hidden="true" />
          Abril 2026
        </button>
        <form action={logoutAction}>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-brand-navy transition hover:border-teal-200 hover:bg-teal-50">
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
