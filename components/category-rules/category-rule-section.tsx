"use client";

import { useActionState, useEffect, useRef } from "react";

import { applyCategoryRulesAction, createCategoryRuleAction, toggleCategoryRuleAction } from "@/app/categories/rule-actions";
import { initialCategoryRuleActionState } from "@/app/categories/category-rule-action-state";
import type { CategoryRuleListItem } from "@/lib/category-rules";

type Option = { id: string; label: string };

export function CategoryRuleSection({ rules, options }: { rules: CategoryRuleListItem[]; options: Option[] }) {
  const [createState, createAction, creating] = useActionState(createCategoryRuleAction, initialCategoryRuleActionState);
  const [applyState, applyAction, applying] = useActionState(applyCategoryRulesAction, initialCategoryRuleActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (createState.status === "success") formRef.current?.reset(); }, [createState.status]);

  return <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-soft lg:p-6" aria-labelledby="rules-title">
    <div><p className="text-xs font-bold uppercase tracking-wide text-brand-teal">Automacao v1</p><h2 id="rules-title" className="mt-1 text-xl font-bold text-brand-navy">Regras automaticas</h2><p className="mt-2 text-sm text-slate-600">Crie regras para categorizar transacoes sem categoria. Elas rodam sozinhas ao importar um extrato, ao criar uma regra e ao reativar uma regra. Use o botao abaixo para reaplicar em transacoes antigas.</p></div>
    {options.length ? <form ref={formRef} action={createAction} className="grid gap-3 md:grid-cols-[1fr_1fr_8rem_auto]" noValidate>
      <label className="text-sm font-medium text-slate-700">Texto da descricao<input className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3" maxLength={80} name="matchText" placeholder="Ex.: UBER" required /></label>
      <label className="text-sm font-medium text-slate-700">Categoria<select className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3" name="categoryId" required><option value="">Selecione</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
      <label className="text-sm font-medium text-slate-700">Prioridade<input className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3" defaultValue={100} min={1} max={1000} name="priority" type="number" required /></label>
      <button className="self-end rounded-md bg-brand-teal px-4 py-3 text-sm font-bold text-white disabled:opacity-60" disabled={creating}>{creating ? "Criando..." : "Criar regra"}</button>
      <ActionMessage state={createState} />
    </form> : <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Crie uma categoria primeiro para habilitar regras.</p>}
    {rules.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Texto</th><th className="p-3">Categoria</th><th className="p-3">Prioridade</th><th className="p-3">Estado</th><th className="p-3">Acao</th></tr></thead><tbody className="divide-y">{rules.map((rule) => <RuleRow key={rule.id} rule={rule} />)}</tbody></table></div> : <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Voce ainda nao criou regras automaticas.<br />Exemplo: quando a descricao contem “UBER”, usar a categoria Transporte.</p>}
    <form action={applyAction}><button className="rounded-md bg-brand-navy px-4 py-3 text-sm font-bold text-white disabled:opacity-60" disabled={applying || rules.length === 0}>{applying ? "Aplicando..." : "Aplicar regras as transacoes sem categoria"}</button></form>
    <ActionMessage state={applyState} />
    {applyState.summary ? <div className="grid gap-2 rounded-lg bg-teal-50 p-4 text-sm text-teal-900 sm:grid-cols-2"><p>{applyState.summary.processedCount} transacoes analisadas.</p><p>{applyState.summary.categorizedCount} categorizadas.</p><p>{applyState.summary.unmatchedCount} permaneceram sem categoria.</p><p>{applyState.summary.activeRuleCount} regras ativas utilizadas.</p></div> : null}
  </section>;
}

function RuleRow({ rule }: { rule: CategoryRuleListItem }) { const [state, action, pending] = useActionState(toggleCategoryRuleAction, initialCategoryRuleActionState); return <tr><td className="p-3 font-medium">{rule.matchText}</td><td className="p-3">{rule.category.name}</td><td className="p-3">{rule.priority}</td><td className="p-3">{rule.isActive ? "Ativa" : "Inativa"}</td><td className="p-3"><form action={action}><input type="hidden" name="ruleId" value={rule.id} /><input type="hidden" name="isActive" value={String(!rule.isActive)} /><button className="font-bold text-brand-teal disabled:opacity-60" disabled={pending}>{pending ? "Salvando..." : rule.isActive ? "Desativar" : "Ativar"}</button></form><ActionMessage state={state} /></td></tr>; }
function ActionMessage({ state }: { state: typeof initialCategoryRuleActionState }) { return state.message ? <p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-rose-700" : "text-emerald-700"}`}>{state.message}</p> : null; }
