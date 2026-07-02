import { ImportForm } from "@/app/import/import-form";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getStatementImportHistory } from "@/lib/imports/statement-import-service";

export default async function ImportPage() {
  const user = await requireCurrentUser();
  const history = await getStatementImportHistory(user.id);

  return (
    <div className="min-h-screen bg-brand-surface">
      <Sidebar activeItem="imports" />
      <main className="lg:pl-72">
        <Topbar eyebrow="CSV seguro" title="Importar extrato" user={user} />
        <div className="space-y-6 px-5 py-6 lg:px-8">
          <section className="rounded-lg border border-teal-100 bg-white p-5 shadow-soft">
            <p className="text-sm font-semibold text-brand-teal">CSV seguro</p>
            <h1 className="mt-2 text-xl font-bold text-brand-navy">
              Envie um CSV ficticio para validar o fluxo de importacao.
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              O arquivo bruto nao e salvo no banco. O Money Flow valida o CSV, gera preview,
              calcula hashes e grava apenas as transacoes confirmadas para o seu usuario.
            </p>
          </section>

          <ImportForm history={history} />
        </div>
      </main>
    </div>
  );
}
