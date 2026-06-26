import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Money Flow",
  description: "Seu GPS financeiro pessoal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
