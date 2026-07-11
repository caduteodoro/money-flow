import { z } from "zod";

const requiredIdentifier = (message: string) => z.string({ error: message }).trim().min(1, message);

export const listTransactionsSchema = z.object({
  userId: requiredIdentifier("Usuario autenticado obrigatorio."),
  uncategorizedOnly: z.boolean().optional().default(false),
});

export const assignTransactionCategorySchema = z.object({
  userId: requiredIdentifier("Usuario autenticado obrigatorio."),
  transactionId: requiredIdentifier("Transacao obrigatoria."),
  categoryId: requiredIdentifier("Categoria obrigatoria."),
});
