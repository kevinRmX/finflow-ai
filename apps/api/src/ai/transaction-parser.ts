import { z } from 'zod';

/** Lo que la IA debe devolver. El backend lo valida antes de guardar nada. */
export const parsedTransactionSchema = z.object({
  operation: z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'UNKNOWN']),
  amount: z.number().positive().nullable(),
  currency: z.string().length(3).nullable(),
  category: z.string().max(60).nullable(),
  merchant: z.string().max(120).nullable(),
  account: z.string().max(60).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  taxAmount: z.number().min(0).nullable(),
  confidence: z.number().min(0).max(1),
  missing: z.array(z.enum(['amount', 'account', 'operation'])),
});
export type ParsedTransaction = z.infer<typeof parsedTransactionSchema>;

/**
 * Quita datos personales antes de mandar el texto a la IA: correos,
 * números largos (cuentas, tarjetas) y teléfonos.
 */
export function anonymize(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[correo]')
    .replace(/\b(?:\d[ -]?){8,19}\b/g, '[número]')
    .slice(0, 500);
}

const CATEGORY_HINTS: Array<[RegExp, string]> = [
  [/\b(gasolina|gas|puma|shell|texaco|uno|uber|indriver|bus|parqueo|taxi)\b/, 'Transporte'],
  [/\b(walmart|super|supermercado|despensa|la torre|paiz|maxi ?despensa|pricesmart)\b/, 'Supermercado'],
  [/\b(almuerzo|comida|cena|desayuno|restaurante|caf[eé]|campero|pizza|hamburguesa)\b/, 'Comida'],
  [/\b(internet|luz|agua|tigo|claro|tel[eé]fono|cable|energ[ií]a)\b/, 'Servicios'],
  [/\b(netflix|spotify|disney|cine|juego|steam)\b/, 'Entretenimiento'],
  [/\b(farmacia|doctor|m[eé]dico|medicina|hospital)\b/, 'Salud'],
  [/\b(salario|sueldo|n[oó]mina|quincena)\b/, 'Salario'],
];

const KNOWN_MERCHANTS = ['Puma', 'Shell', 'Texaco', 'Walmart', 'Paiz', 'La Torre', 'PriceSmart', 'Pollo Campero', 'Tigo', 'Claro', 'Uber', 'Netflix', 'Spotify'];

/**
 * Interpretación local sin IA: sirve de respaldo cuando Gemini no responde o
 * se agotó la cuota, y para registrar sin gastar tokens los casos simples.
 */
export function localParse(text: string, today: string, accountAliases: string[] = []): ParsedTransaction {
  const t = text.toLowerCase();
  const amountMatch =
    t.match(/q\s?\.?\s?([\d,]+(?:\.\d{1,2})?)/) ??
    t.match(/([\d,]+(?:\.\d{1,2})?)\s?(?:quetzales|q\b)/) ??
    t.match(/\$\s?([\d,]+(?:\.\d{1,2})?)/);
  const amount = amountMatch ? Number.parseFloat(amountMatch[1].replace(/,/g, '')) : null;
  const currency = /\$|d[oó]lares|usd/.test(t) ? 'USD' : 'GTQ';

  const income = /\b(me pagaron|pagaron|salario|sueldo|recib[ií]|me depositaron|ingreso|cobr[eé]|vend[ií])\b/.test(t);
  const transfer = /\b(transfer[ií]|pas[eé] .* a (mi )?cuenta)\b/.test(t);
  const operation = transfer ? 'TRANSFER' : income ? 'INCOME' : amount ? 'EXPENSE' : 'UNKNOWN';

  const category = CATEGORY_HINTS.find(([re]) => re.test(t))?.[1] ?? (income ? 'Otros ingresos' : null);
  const merchant = KNOWN_MERCHANTS.find((m) => t.includes(m.toLowerCase())) ?? null;

  const account =
    accountAliases.find((a) => t.includes(a.toLowerCase())) ??
    (/\befectivo\b/.test(t) ? accountAliases.find((a) => /efectivo/i.test(a)) ?? 'Efectivo' : null);

  let date = today;
  if (/\bayer\b/.test(t)) {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    date = d.toISOString().slice(0, 10);
  }

  const missing: ParsedTransaction['missing'] = [];
  if (!amount) missing.push('amount');
  if (operation === 'UNKNOWN') missing.push('operation');

  return {
    operation,
    amount,
    currency,
    category,
    merchant,
    account,
    date,
    taxAmount: null,
    confidence: amount ? (category ? 0.9 : 0.75) : 0.2,
    missing,
  };
}
