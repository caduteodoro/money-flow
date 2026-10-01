import Link from "next/link"
import { BarChart3, FileUp, Gauge, Layers3, ListChecks, Settings } from "lucide-react"

import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: Gauge },
  { id: "imports", href: "/import", label: "Importações", icon: FileUp },
  { id: "transactions", href: "/transactions", label: "Transações", icon: ListChecks },
  { id: "categories", href: "/categories", label: "Categorias", icon: Layers3 },
  { id: "reports", href: "/dashboard", label: "Relatórios", icon: BarChart3 },
  { id: "settings", href: "/settings", label: "Ajustes", icon: Settings },
] as const

export type SidebarItem = (typeof navItems)[number]["id"]

type SidebarProps = {
  activeItem?: SidebarItem
}

export function Sidebar({ activeItem = "dashboard" }: SidebarProps) {
  return (
    <ShadcnSidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Money Flow"
              render={<Link href="/" />}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary font-bold text-sidebar-primary-foreground">
                MF
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-semibold">Money Flow</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Seu GPS financeiro
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                const active = item.id === activeItem

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={<Link aria-current={active ? "page" : undefined} href={item.href} />}
                    >
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3 group-data-[collapsible=icon]:hidden">
          <p className="text-xs font-semibold text-sidebar-primary">Ambiente pessoal</p>
          <p className="mt-1 text-xs leading-5 text-sidebar-foreground/70">
            Dados financeiros isolados por usuário.
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  )
}
