import { z } from "zod";

import { normalizeDescription } from "@/lib/parsers/normalization";

const identifier = (message: string) => z.string({ error: message }).trim().min(1, message);
export const normalizedRuleTextSchema = z.string({ error: "Informe o texto de correspondencia." })
  .transform(normalizeRuleDisplayText)
  .pipe(z.string().min(2, "O texto deve ter ao menos 2 caracteres.").max(80, "O texto deve ter no maximo 80 caracteres."));

export const listCategoryRulesSchema = z.object({ userId: identifier("Usuario autenticado obrigatorio.") });
export const createCategoryRuleSchema = z.object({
  userId: identifier("Usuario autenticado obrigatorio."),
  matchText: normalizedRuleTextSchema,
  categoryId: identifier("Categoria obrigatoria."),
  priority: z.coerce.number({ error: "Informe uma prioridade valida." }).int("A prioridade deve ser inteira.").min(1, "A prioridade minima e 1.").max(1000, "A prioridade maxima e 1000.").default(100),
});
export const toggleCategoryRuleSchema = z.object({
  userId: identifier("Usuario autenticado obrigatorio."),
  ruleId: identifier("Regra obrigatoria."),
  isActive: z.boolean(),
});

export function normalizeRuleDisplayText(value: string) { return value.normalize("NFKC").trim().replace(/\s+/g, " "); }
export function normalizeRuleMatchText(value: string) { return normalizeDescription(value); }
