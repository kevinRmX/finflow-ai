import { z } from 'zod';

export const createTransactionSchema = z
  .object({
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    amount: z.number().positive().max(100_000_000),
    accountId: z.uuid(),
    toAccountId: z.uuid().optional(),
    categoryId: z.uuid().optional(),
    merchant: z.string().trim().max(120).optional(),
    description: z.string().trim().max(500).optional(),
    date: z.coerce.date().optional(),
    taxAmount: z.number().min(0).optional(),
  })
  .refine((t) => t.type !== 'TRANSFER' || (t.toAccountId && t.toAccountId !== t.accountId), {
    message: 'Una transferencia necesita una cuenta destino distinta',
    path: ['toAccountId'],
  });
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const listTransactionsSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  categoryId: z.uuid().optional(),
  accountId: z.uuid().optional(),
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>;

export const updateCategorySchema = z.object({ categoryId: z.uuid() });
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
