import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type BaseProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkButtonProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const variants = {
  primary:
    "bg-brand-teal text-white shadow-soft hover:bg-teal-700 focus-visible:outline-teal-700",
  secondary:
    "border border-slate-200 bg-white text-brand-navy hover:border-teal-200 hover:bg-teal-50 focus-visible:outline-teal-700",
  ghost:
    "text-brand-navy hover:bg-white/70 focus-visible:outline-teal-700",
};

const baseClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button className={`${baseClass} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  variant = "primary",
  className = "",
  href,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={`${baseClass} ${variants[variant]} ${className}`} href={href} {...props}>
      {children}
    </Link>
  );
}
