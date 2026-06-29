"use client";

import { CheckCircle2, FileUp, Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import {
  confirmStatementImportAction,
  previewStatementImportAction,
  type ImportActionState,
} from "@/app/import/actions";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-teal">CSV</p>
              <h2 className="text-lg font-bold text-brand-navy">Importar extrato</h2>
            </div>
            <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Max. 2 MB
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <form action={previewAction} className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Arquivo CSV</span>
              <input
                accept=".csv,text/csv"
                className="mt-2 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-teal hover:file:bg-teal-100"
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
            </label>

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
        </CardBody>
      </Card>

      {preview ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-brand-navy">Preview</h2>
                <p className="text-sm text-slate-500">
                  {preview.sourceProvider} via {preview.parserId}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Periodo: {formatStatementPeriod(preview.periodStart, preview.periodEnd)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <span className="rounded-md bg-slate-100 px-2.5 py-1">{preview.rowCount} linhas</span>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700">
                  {preview.rowCount - preview.duplicateCount - preview.invalidRowCount} novas
                </span>
                <span className="rounded-md bg-amber-50 px-2.5 py-1 text-amber-700">
                  {preview.duplicateCount} duplicadas
                </span>
                <span className="rounded-md bg-rose-50 px-2.5 py-1 text-rose-700">
                  {preview.invalidRowCount} invalidas
                </span>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Descricao</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewRows.map((row) => (
                    <tr key={`${row.sourceRowNumber}-${row.occurredAt}`} className="text-slate-700">
                      <td className="px-4 py-3">{formatDate(row.occurredAt)}</td>
                      <td className="max-w-[320px] truncate px-4 py-3">{row.description}</td>
                      <td className="px-4 py-3">{formatDirection(row.direction)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatMoney(row.amountCents)}</td>
                      <td className="px-4 py-3">
                        <LineStatus duplicate={row.duplicate} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.warnings.length > 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <TriangleAlert className="size-4" aria-hidden="true" />
                  Linhas ignoradas
                </div>
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {preview.warnings.slice(0, 5).map((warning, index) => (
                    <li key={`${warning.row ?? "row"}-${index}`}>
                      Linha {warning.row ?? "-"}: {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardBody>
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
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileUp className="size-4" aria-hidden="true" />}
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
      variant="secondary"
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="size-4" aria-hidden="true" />
      )}
      Confirmar importacao
    </Button>
  );
}

function ActionMessage({ state }: { state: ImportActionState }) {
  if (!state.message) {
    return null;
  }

  const styles =
    state.status === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return <p className={`rounded-md border px-3 py-2 text-sm ${styles}`}>{state.message}</p>;
}

function LineStatus({ duplicate }: { duplicate: boolean }) {
  if (duplicate) {
    return <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Duplicada</span>;
  }

  return <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Nova</span>;
}

function ImportSummary({ summary }: { summary: StatementImportSummary }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-bold text-brand-navy">Resumo da importacao</h2>
      </CardHeader>
      <CardBody>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="Total de linhas" value={summary.rowCount} />
          <SummaryItem label="Importadas" value={summary.importedCount} />
          <SummaryItem label="Duplicadas" value={summary.duplicateCount} />
          <SummaryItem label="Invalidas/ignoradas" value={summary.invalidRowCount} />
        </div>
      </CardBody>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-brand-navy">{value}</p>
    </div>
  );
}

function ImportHistory({ history }: { history: StatementImportSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-bold text-brand-navy">Historico de importacoes</h2>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-[860px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Origem/parser</th>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3 text-right">Linhas</th>
                <th className="px-4 py-3 text-right">Importadas</th>
                <th className="px-4 py-3 text-right">Duplicadas</th>
                <th className="px-4 py-3 text-right">Ignoradas</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length > 0 ? (
                history.map((item) => (
                  <tr key={item.id} className="text-slate-700">
                    <td className="px-4 py-3">{formatDateTime(item.createdAt)}</td>
                    <td className="px-4 py-3">{item.sourceProvider ?? "CSV"}</td>
                    <td className="px-4 py-3">{formatStatementPeriod(item.periodStart, item.periodEnd)}</td>
                    <td className="px-4 py-3 text-right">{item.rowCount}</td>
                    <td className="px-4 py-3 text-right">{item.importedCount}</td>
                    <td className="px-4 py-3 text-right">{item.duplicateCount}</td>
                    <td className="px-4 py-3 text-right">{item.invalidRowCount}</td>
                    <td className="px-4 py-3">{formatStatus(item.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                    Nenhuma importacao registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function formatMoney(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatementPeriod(periodStart: string | null, periodEnd: string | null) {
  if (!periodStart || !periodEnd) {
    return "-";
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const startLabel = formatMonthYear(start);
  const endLabel = formatMonthYear(end);

  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

function formatMonthYear(value: Date) {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);

  const label = formatted.replace(".", "").replace(" de ", "/");

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDirection(direction: string) {
  const labels: Record<string, string> = {
    INCOME: "Entrada",
    EXPENSE: "Saida",
    TRANSFER: "Transferencia",
    REVERSAL: "Estorno",
  };

  return labels[direction] ?? direction;
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendente",
    PROCESSING: "Processando",
    COMPLETED: "Concluida",
    FAILED: "Falhou",
  };

  return labels[status] ?? status;
}
