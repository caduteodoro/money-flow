"use client";

import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-5 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Dashboard indisponível</p>
          <CardTitle className="text-2xl">Não foi possível carregar o cockpit financeiro.</CardTitle>
          <CardDescription>Seus dados não foram alterados. Tente novamente para refazer a consulta segura.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Alert>
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>Falha temporária</AlertTitle>
            <AlertDescription>A consulta não pôde ser concluída neste momento.</AlertDescription>
          </Alert>
          <Button className="w-fit" onClick={reset} type="button">Tentar novamente</Button>
        </CardContent>
      </Card>
    </main>
  );
}
