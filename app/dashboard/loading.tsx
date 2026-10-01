import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="min-h-svh bg-background px-4 py-5 sm:px-6 lg:px-8 lg:py-7" aria-busy="true" aria-label="Carregando dashboard">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-full max-w-xl" />
            <Skeleton className="h-4 w-full max-w-3xl" />
          </CardHeader>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-36" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-14 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Skeleton className="h-[28rem] w-full rounded-xl" />
        <Skeleton className="h-[26rem] w-full rounded-xl" />
        <Skeleton aria-label="Carregando distribuição das saídas" className="h-24 w-full rounded-xl md:h-80" />
        <div aria-label="Carregando principais gastos do período" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton className="h-80 w-full rounded-xl" key={index} />
          ))}
        </div>
      </div>
      <span className="sr-only" role="status">Carregando indicadores e visualizações.</span>
    </main>
  );
}
