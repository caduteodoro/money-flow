export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-5 lg:pl-80 lg:pr-8 lg:py-7" aria-busy="true" aria-label="Carregando dashboard">
      <div className="space-y-6 animate-pulse motion-reduce:animate-none">
        <div className="h-28 rounded-2xl border border-slate-200 bg-white" />
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div className="h-52 rounded-xl border border-slate-200 bg-white" key={index} />)}
        </div>
        <div className="h-[28rem] rounded-xl border border-slate-200 bg-white" />
        <div className="h-[26rem] rounded-xl border border-slate-200 bg-white" />
        <div aria-label="Carregando distribuição das saídas" className="h-24 rounded-xl border border-slate-200 bg-white md:h-80" />
        <div aria-label="Carregando principais gastos do período" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => <div className="h-80 rounded-xl border border-slate-200 bg-white" key={index} />)}
        </div>
      </div>
      <span className="sr-only" role="status">Carregando indicadores e visualizações.</span>
    </main>
  );
}
