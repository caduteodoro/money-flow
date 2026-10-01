"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, Play, Plus, TriangleAlert } from "lucide-react";

import { applyCategoryRulesAction, createCategoryRuleAction, toggleCategoryRuleAction } from "@/app/categories/rule-actions";
import { initialCategoryRuleActionState } from "@/app/categories/category-rule-action-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CategoryRuleListItem } from "@/lib/category-rules";

type Option = { id: string; label: string };

export function CategoryRuleSection({ rules, options }: { rules: CategoryRuleListItem[]; options: Option[] }) {
  const [createState, createAction, creating] = useActionState(createCategoryRuleAction, initialCategoryRuleActionState);
  const [applyState, applyAction, applying] = useActionState(applyCategoryRulesAction, initialCategoryRuleActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (createState.status === "success") formRef.current?.reset();
  }, [createState.status]);

  return (
    <Card aria-labelledby="rules-title">
      <CardHeader>
        <CardTitle id="rules-title">Regras automáticas</CardTitle>
        <CardDescription>
          Crie regras para categorizar transações sem categoria. A aplicação acontece somente quando você aciona o botão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {options.length ? (
          <form ref={formRef} action={createAction} className="grid gap-3 md:grid-cols-[1fr_1fr_8rem_auto]" noValidate>
            <Field>
              <FieldLabel htmlFor="rule-match-text">Texto da descrição</FieldLabel>
              <Input id="rule-match-text" maxLength={80} name="matchText" placeholder="Ex.: UBER" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="rule-category">Categoria</FieldLabel>
              <select id="rule-category" className="h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" name="categoryId" required>
                <option value="">Selecione</option>
                {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="rule-priority">Prioridade</FieldLabel>
              <Input id="rule-priority" defaultValue={100} min={1} max={1000} name="priority" type="number" required />
            </Field>
            <Button className="self-end" disabled={creating} type="submit">
              {creating ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
              {creating ? "Criando..." : "Criar regra"}
            </Button>
            <div className="md:col-span-full"><ActionMessage state={createState} /></div>
          </form>
        ) : (
          <Alert><TriangleAlert aria-hidden="true" /><AlertDescription>Crie uma categoria primeiro para habilitar regras.</AlertDescription></Alert>
        )}

        {rules.length ? (
          <div className="rounded-lg border">
            <Table className="min-w-[700px]">
              <TableHeader><TableRow><TableHead>Texto</TableHead><TableHead>Categoria</TableHead><TableHead>Prioridade</TableHead><TableHead>Estado</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader>
              <TableBody>{rules.map((rule) => <RuleRow key={rule.id} rule={rule} />)}</TableBody>
            </Table>
          </div>
        ) : (
          <Alert><AlertDescription>Você ainda não criou regras automáticas. Exemplo: quando a descrição contém “UBER”, usar a categoria Transporte.</AlertDescription></Alert>
        )}

        <form action={applyAction}>
          <Button disabled={applying || rules.length === 0} type="submit" variant="secondary">
            {applying ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" />}
            {applying ? "Aplicando..." : "Aplicar regras às transações sem categoria"}
          </Button>
        </form>
        <ActionMessage state={applyState} />
        {applyState.summary ? (
          <div className="grid gap-2 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2">
            <p>{applyState.summary.processedCount} transações analisadas.</p>
            <p>{applyState.summary.categorizedCount} categorizadas.</p>
            <p>{applyState.summary.unmatchedCount} permaneceram sem categoria.</p>
            <p>{applyState.summary.activeRuleCount} regras ativas utilizadas.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function RuleRow({ rule }: { rule: CategoryRuleListItem }) {
  const [state, action, pending] = useActionState(toggleCategoryRuleAction, initialCategoryRuleActionState);
  return (
    <TableRow>
      <TableCell className="font-medium">{rule.matchText}</TableCell>
      <TableCell>{rule.category.name}</TableCell>
      <TableCell>{rule.priority}</TableCell>
      <TableCell><Badge variant={rule.isActive ? "default" : "outline"}>{rule.isActive ? "Ativa" : "Inativa"}</Badge></TableCell>
      <TableCell>
        <form action={action} className="space-y-2">
          <input type="hidden" name="ruleId" value={rule.id} />
          <input type="hidden" name="isActive" value={String(!rule.isActive)} />
          <Button disabled={pending} size="sm" type="submit" variant="ghost">
            {pending ? "Salvando..." : rule.isActive ? "Desativar" : "Ativar"}
          </Button>
          <ActionMessage state={state} compact />
        </form>
      </TableCell>
    </TableRow>
  );
}

function ActionMessage({ state, compact = false }: { state: typeof initialCategoryRuleActionState; compact?: boolean }) {
  if (!state.message) return null;
  const isError = state.status === "error";
  if (compact) return <p aria-live="polite" className={`text-xs ${isError ? "text-destructive" : "text-emerald-700"}`}>{state.message}</p>;
  return (
    <Alert aria-live="polite" variant={isError ? "destructive" : "default"}>
      {isError ? <TriangleAlert aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
