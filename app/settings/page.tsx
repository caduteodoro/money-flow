import { TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { AccountDeletionForm } from "@/components/settings/account-deletion-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function SettingsPage() {
  const user = await requireCurrentUser();

  return (
    <AppShell
      activeItem="settings"
      contentClassName="flex flex-col gap-6"
      eyebrow="Conta"
      periodLabel="Configurações"
      title="Ajustes"
      user={user}
    >
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-destructive">Zona de perigo</p>
          <CardTitle className="text-xl sm:text-2xl">Excluir conta definitivamente</CardTitle>
          <CardDescription className="max-w-3xl leading-6">
            Esta ação é imediata e irreversível. Não existe recuperação, recibo permanente ou período de espera.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Todos os dados associados serão removidos</AlertTitle>
            <AlertDescription>
              Cadastro, sessões, contas bancárias, importações, transações, categorias, regras, logs, hashes e limites de acesso vinculáveis à sua identidade. O CSV bruto não é armazenado.
            </AlertDescription>
          </Alert>
          <AccountDeletionForm />
        </CardContent>
      </Card>
    </AppShell>
  );
}
