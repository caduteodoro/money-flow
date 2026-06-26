import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-soft ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return <div className={`border-b border-slate-100 px-5 py-4 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = "" }: CardProps) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
