import Link from "next/link"
import { Compass } from "lucide-react"

import { cn } from "@/lib/utils"

type BrandMarkProps = {
  className?: string
  href?: string
  inverted?: boolean
}

export function BrandMark({ className, href = "/", inverted = false }: BrandMarkProps) {
  return (
    <Link className={cn("flex w-fit items-center gap-3", className)} href={href}>
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl",
          inverted ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        <Compass aria-hidden="true" className="size-5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn("font-semibold", inverted && "text-sidebar-foreground")}>Money Flow</span>
        <span className={cn("text-xs text-muted-foreground", inverted && "text-sidebar-foreground/65")}>
          Seu GPS financeiro pessoal
        </span>
      </span>
    </Link>
  )
}
