"use client";

import { CheckCircle2, FileUp, Loader2, TriangleAlert } from "lucide-react";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import {
  confirmStatementImportAction,
  previewStatementImportAction,
  type ImportActionState,
} from "@/app/import/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StatementImportSummary } from "@/lib/imports/statement-import-service";

const initialState: ImportActionState = {
  status: "idle",
  message: null,
};

type ImportFormProps = {
  history: StatementImportSummary[];
};

type SelectedFile = {
  file: File;
  name: string;
  size: number;
};

export function ImportForm({ history }: ImportFormProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [previewFile, setPreviewFile] = useState<SelectedFile | null>(null);
  const [confirmState, setConfirmState] = useState<ImportActionState>(initialState);
  const [isConfirmPending, startConfirmTransition] = useTransition();
  const [previewState, previewAction] = useActionState(previewStatementImportAction, initialState);
  const preview = previewState.preview;
  const canConfirm =
    Boolean(preview) &&
    selectedFile?.name === previewFile?.name &&
    selectedFile?.size === previewFile?.size &&
    previewFile?.size === preview?.fileSizeBytes;
  const previewRows = useMemo(() => preview?.transactions.slice(0, 10) ?? [], [preview]);

  useEffect(() => {
    if (confirmState.summary) {
      router.refresh();
    }
  }, [confirmState.summary, router]);

  useEffect(() => {
    if (previewState.preview && selectedFile?.size === previewState.preview.fileSizeBytes) {
      setPreviewFile(selectedFile);
    }
  }, [previewState.preview, selectedFile]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importar extrato</CardTitle>
          <CardDescription>Selecione um CSV e revise o preview antes de confirmar.</CardDescription>
          <CardAction>
            <Badge variant="secondary">Máx. 2 MB</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form action={previewAction} className="space-y-5">
            <Field>
              <FieldLabel htmlFor="statement-file">Arquivo CSV</FieldLabel>
              <Input
                accept=".csv,text/csv"
                id="statement-file"
                name="statementFile"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setSelectedFile(file ? { file, name: file.name, size: file.size } : null);
                  setPreviewFile(null);
                  setConfirmState(initialState);
                }}
                required
                type="file"
              />
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row">
              <PreviewButton />
              <ConfirmButton
                canConfirm={canConfirm}
                isPending={isConfirmPending}
                onConfirm={() => {
                  if (!selectedFile) {
                    setConfirmState({
                      status: "error",
                      message: "Selecione um arquivo CSV antes de confirmar.",
                    });
                    return;
                  }

                  const formData = new FormData();
                  formData.set("statementFile", selectedFile.file, selectedFile.name);

                  startConfirmTransition(async () => {
                    const nextState = await confirmStatementImportAction(initialState, formData);
                    setConfirmState(nextState);
                  });
                }}
              />
            </div>

            <ActionMessage state={previewState} />
            <ActionMessage state={confirmState} />
          </form>
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {preview.sourceProvider} via {preview.parserId} · {formatStatementPeriod(preview.periodStart, preview.periodEnd)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{preview.rowCount} linhas</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" variant="secondary">
                {preview.rowCount - preview.duplicateCount - preview.invalidRowCount} novas
              </Badge>
              <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" variant="secondary">
                {preview.duplicateCount} duplicadas
              </Badge>
              <Badge variant="destructive">{preview.invalidRowCount} inválidas</Badge>
            </div>

            <div className="rounded-lg border">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row) => (
                    <TableRow key={`${row.sourceRowNumber}-${row.occurredAt}`}>
                      <TableCell>{formatDate(row.occurredAt)}</TableCell>
                      <TableCell className="max-w-[320px] truncate">{row.description}</TableCell>
                      <TableCell>{formatDirection(row.direction)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatMoney(row.amountCents)}</TableCell>
                      <TableCell><LineStatus duplicate={row.duplicate} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {preview.warnings.length > 0 ? (
              <Alert>
                <TriangleAlert aria-hidden="true" />
                <AlertTitle>Linhas ignoradas</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 space-y-1">
                    {preview.warnings.slice(0, 5).map((warning, index) => (
                      <li key={`${warning.row ?? "row"}-${index}`}>
                        Linha {warning.row ?? "-"}: {warning.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {confirmState.summary ? <ImportSummary summary={confirmState.summary} /> : null}
      <ImportHistory history={history} />
    </div>
  );
}

function PreviewButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full sm:w-auto" disabled={pending} type="submit">
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <FileUp aria-hidden="true" />}
      Gerar preview
    </Button>
  );
}

function ConfirmButton({
  canConfirm,
  isPending,
  onConfirm,
}: {
  canConfirm: boolean;
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Button
      className="w-full sm:w-auto"
      disabled={isPending || !canConfirm}
      onClick={onConfirm}
      type="button"
      variant="outline"
    >
      {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
      Confirmar importação
    </Button>
  );
}

function ActionMessage({ state }: { state: ImportActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <Alert variant={state.status === "error" ? "destructive" : "default"}>
      {state.status === "error" ? <TriangleAlert aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
      <AlertTitle>{state.status === "error" ? "Não foi possível continuar" : "Importação atualizada"}</AlertTitle>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}

function LineStatus({ duplicate }: { duplicate: boolean }) {
  return duplicate ? (
    <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" variant="secondary">Duplicada</Badge>
  ) : (
    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" variant="secondary">Nova</Badge>
  );
}

function ImportSummary({ summary }: { summary: StatementImportSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo da importação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="Total de linhas" value={summary.rowCount} />
          <SummaryItem label="Importadas" value={summary.importedCount} />
          <SummaryItem label="Duplicadas" value={summary.duplicateCount} />
          <SummaryItem label="Inválidas/ignoradas" value={summary.invalidRowCount} />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function ImportHistory({ history }: { history: StatementImportSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de importações</CardTitle>
        <CardDescription>Processamentos realizados na sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Origem/parser</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Linhas</TableHead>
                <TableHead className="text-right">Importadas</TableHead>
                <TableHead className="text-right">Duplicadas</TableHead>
                <TableHead className="text-right">Ignoradas</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length > 0 ? (
                history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                    <TableCell>{item.sourceProvider ?? "CSV"}</TableCell>
                    <TableCell>{formatStatementPeriod(item.periodStart, item.periodEnd)}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.rowCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.importedCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.duplicateCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.invalidRowCount}</TableCell>
                    <TableCell><Badge variant="outline">{formatStatus(item.status)}</Badge></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground" colSpan={8}>
                    Nenhuma importação registrada ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function formatMoney(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountCents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatStatementPeriod(periodStart: string | null, periodEnd: string | null) {
  if (!periodStart || !periodEnd) {
    return "-";
  }

  const startLabel = formatMonthYear(new Date(periodStart));
  const endLabel = formatMonthYear(new Date(periodEnd));
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

function formatMonthYear(value: Date) {
  const formatted = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" }).format(value);
  const label = formatted.replace(".", "").replace(" de ", "/");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDirection(direction: string) {
  const labels: Record<string, string> = {
    INCOME: "Entrada",
    EXPENSE: "Saída",
    TRANSFER: "Transferência",
    REVERSAL: "Estorno",
  };
  return labels[direction] ?? direction;
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendente",
    PROCESSING: "Processando",
    COMPLETED: "Concluída",
    FAILED: "Falhou",
  };
  return labels[status] ?? status;
}
