import { CheckCircle2 } from "lucide-react";

import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountDeletedPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-5">
      <Card className="w-full max-w-xl text-center">
        <CardHeader>
          <span className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground">
            <CheckCircle2 aria-hidden="true" className="size-6" />
          </span>
          <CardTitle className="text-2xl">Solicitação concluída</CardTitle>
          <CardDescription className="mx-auto max-w-md leading-6">
            A conta associada à sessão foi excluída. Nenhum detalhe identificável é exibido nesta confirmação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LinkButton href="/">Voltar ao início</LinkButton>
        </CardContent>
      </Card>
    </main>
  );
}
