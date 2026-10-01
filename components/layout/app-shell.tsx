import type { ReactNode } from "react"

import { Sidebar, type SidebarItem } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type AppShellProps = {
  activeItem: SidebarItem
  children: ReactNode
  contentClassName?: string
  eyebrow: string
  periodLabel?: string
  showContextBadge?: boolean
  title: string
  user: {
    name?: string
    email: string
  }
}

export function AppShell({
  activeItem,
  children,
  contentClassName,
  eyebrow,
  periodLabel,
  showContextBadge = true,
  title,
  user,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <Sidebar activeItem={activeItem} />
      <SidebarInset className="min-w-0">
        <Topbar
          eyebrow={eyebrow}
          periodLabel={periodLabel}
          showContextBadge={showContextBadge}
          title={title}
          user={user}
        />
        <div className={cn("min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7", contentClassName)}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
