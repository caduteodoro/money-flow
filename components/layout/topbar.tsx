import { CalendarDays, LogOut } from "lucide-react"

import { logoutAction } from "@/app/logout/actions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

type TopbarProps = {
  user: {
    name?: string
    email: string
  }
  eyebrow?: string
  title?: string
  periodLabel?: string
  showContextBadge?: boolean
}

export function Topbar({
  user,
  eyebrow = "Visão geral",
  title = "Dashboard financeiro",
  periodLabel = "Período",
  showContextBadge = true,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b bg-background/92 px-4 backdrop-blur sm:px-6 lg:px-8">
      <SidebarTrigger aria-label="Alternar navegação" />
      <Separator className="h-5" orientation="vertical" />

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>

      <div className="flex items-center gap-2">
        {showContextBadge && periodLabel ? (
          <Badge className="h-8 gap-1.5 px-3" variant="secondary">
            <CalendarDays data-icon="inline-start" aria-hidden="true" />
            {periodLabel}
          </Badge>
        ) : null}

        <div className="hidden min-w-0 text-right lg:block">
          <p className="max-w-52 truncate text-sm font-medium">{user.name ?? "Usuário"}</p>
        </div>

        <Avatar size="lg">
          <AvatarFallback>{getInitials(user.name ?? user.email)}</AvatarFallback>
        </Avatar>

        <form action={logoutAction}>
          <Button aria-label="Sair" type="submit" variant="outline">
            <LogOut data-icon="inline-start" aria-hidden="true" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </form>
      </div>
    </header>
  )
}

function getInitials(value: string) {
  return value
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("pt-BR"))
    .join("")
}
