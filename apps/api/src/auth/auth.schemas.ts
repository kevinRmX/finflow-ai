import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().max(254),
  password: z.string().min(10, 'Mínimo 10 caracteres').max(256),
  currency: z.string().length(3).optional(),
  locale: z.enum(['es', 'en']).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const credentialsSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
});
export type CredentialsInput = z.infer<typeof credentialsSchema>;

export const refreshSchema = z.object({ refreshToken: z.string().min(1).max(512) });
export type RefreshInput = z.infer<typeof refreshSchema>;
