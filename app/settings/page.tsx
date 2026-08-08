import { AccountDeletionForm } from "@/components/settings/account-deletion-form";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function SettingsPage() {
  const user = await requireCurrentUser();

  return (
    <div className="min-h-screen bg-brand-surface">
      <Sidebar activeItem="settings" />
      <main className="lg:pl-72">
        <Topbar eyebrow="Conta" periodLabel="Configuracoes" title="Ajustes" user={user} />
        <div className="px-5 py-6 lg:px-8">
          <section className="rounded-xl border border-rose-200 bg-white p-5 shadow-soft lg:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Zona de perigo</p>
            <h1 className="mt-2 text-2xl font-bold text-brand-navy">Excluir conta definitivamente</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              Esta acao e imediata e irreversivel. Nao existe recuperacao, recibo permanente ou periodo de espera.
            </p>
            <div className="mt-5 max-w-3xl rounded-lg bg-rose-50 p-4 text-sm text-rose-950">
              <p className="font-semibold">O que sera removido</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>seu cadastro e todas as sessoes;</li>
                <li>contas bancarias, importacoes e transacoes;</li>
                <li>categorias e regras automaticas;</li>
                <li>logs, hashes e limites de acesso vinculaveis a sua identidade.</li>
              </ul>
              <p className="mt-3">O arquivo CSV bruto nao e armazenado pelo Money Flow.</p>
            </div>
            <AccountDeletionForm />
          </section>
        </div>
      </main>
    </div>
  );
}
