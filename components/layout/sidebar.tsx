import Link from "next/link";
import { BarChart3, FileUp, Home, Layers3, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard", label: "Importações", icon: FileUp },
  { href: "/dashboard", label: "Categorias", icon: Layers3 },
  { href: "/dashboard", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard", label: "Ajustes", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 lg:flex lg:flex-col">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-lg bg-brand-navy text-sm font-bold text-white">
          MF
        </span>
        <span>
          <span className="block text-base font-bold text-brand-navy">Money Flow</span>
          <span className="block text-xs text-slate-500">Seu GPS financeiro pessoal.</span>
        </span>
      </Link>

      <nav className="mt-10 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-teal-50 hover:text-brand-teal"
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-slate-200 bg-brand-sky p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal">Sprint 0</p>
        <p className="mt-2 text-sm text-slate-700">Fundação preparada para importar CSV no MVP.</p>
      </div>
    </aside>
  );
}
