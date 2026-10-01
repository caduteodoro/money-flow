import { ImportForm } from "@/app/import/import-form";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getStatementImportHistory } from "@/lib/imports/statement-import-service";

export default async function ImportPage() {
  const user = await requireCurrentUser();
  const history = await getStatementImportHistory(user.id);

  return (
    <AppShell
      activeItem="imports"
      contentClassName="flex flex-col gap-6"
      eyebrow="CSV seguro"
      title="Importar extrato"
      user={user}
    >
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Importação protegida</p>
          <CardTitle className="text-xl sm:text-2xl">Transforme um CSV em visão financeira</CardTitle>
          <CardDescription className="max-w-3xl leading-6">
            O arquivo bruto não é salvo. O Money Flow valida o conteúdo, gera preview, calcula hashes e grava somente as transações confirmadas para seu usuário.
          </CardDescription>
        </CardHeader>
      </Card>

      <ImportForm history={history} />
    </AppShell>
  );
}
