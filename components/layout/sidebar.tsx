import Link from "next/link";
import { BarChart3, FileUp, Home, Layers3, Settings } from "lucide-react";

const navItems = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: Home },
  { id: "imports", href: "/import", label: "Importacoes", icon: FileUp },
  { id: "categories", href: "/dashboard", label: "Categorias", icon: Layers3 },
  { id: "reports", href: "/dashboard", label: "Relatorios", icon: BarChart3 },
  { id: "settings", href: "/dashboard", label: "Ajustes", icon: Settings },
];

type SidebarProps = {
  activeItem?: "dashboard" | "imports" | "categories" | "reports" | "settings";
};

export function Sidebar({ activeItem = "dashboard" }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200/80 bg-white px-5 py-6 lg:flex lg:flex-col">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-brand-navy text-sm font-bold text-white shadow-soft">
          MF
        </span>
        <span>
          <span className="block text-base font-bold text-brand-navy">Money Flow</span>
          <span className="block text-xs text-slate-500">Seu GPS financeiro pessoal.</span>
        </span>
      </Link>

      <nav className="mt-10 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeItem;

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
                active
                  ? "bg-teal-50 text-brand-teal shadow-[inset_3px_0_0_#0f766e]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-brand-teal"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-sky-100 bg-sky-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal">MVP em evolucao</p>
        <p className="mt-2 text-sm text-slate-700">
          Dashboard com KPIs, graficos e insights calculados localmente.
        </p>
      </div>
    </aside>
  );
}
