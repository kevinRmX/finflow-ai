export interface BankAlert {
  amount: number;
  currency: 'GTQ' | 'USD';
  merchant: string | null;
  cardLast4: string | null;
}

/**
 * Lee el texto de una alerta de consumo (notificación o correo del banco).
 * Los formatos varían por banco; esta versión cubre los patrones comunes en
 * Guatemala ("Compra por Q250.00 en PUMA ... tarjeta terminada en 4821").
 * Devuelve null si el texto no parece una compra.
 */
export function parseBankAlert(text: string): BankAlert | null {
  // Las alertas reales son cortas; cortar el texto acota el costo de cada regex.
  const clean = text.slice(0, 1000).replace(/\s+/g, ' ').trim();
  if (!/(compra|consumo|cargo|pago|transacci[oó]n|retiro)/i.test(clean)) return null;
  if (/(rechazad|declinad|no autorizad|fallid)/i.test(clean)) return null;

  const money =
    clean.match(/\b(GTQ|Q|USD|US\$|\$)\s?\.?\s?(\d[\d,]*\.\d{2}|\d[\d,]*)/i) ??
    clean.match(/(?<![\d,])(\d[\d,]*\.\d{2})\s?(GTQ|USD|quetzales|d[oó]lares)/i);
  if (!money) return null;

  const [symbol, rawAmount] = /^\d/.test(money[1]) ? [money[2], money[1]] : [money[1], money[2]];
  const amount = Number.parseFloat(rawAmount.replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const currency = /usd|\$|d[oó]lar/i.test(symbol) ? 'USD' : 'GTQ';

  const merchantMatch = clean.match(
    /\b(?:en|comercio:?)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9&'.\- ]{2,40}?)(?=\s+(?:con|el|por|fecha|tarjeta|a las|autorizaci[oó]n)\b|[.,;]|$)/i,
  );
  const merchant = merchantMatch ? titleCase(merchantMatch[1].trim()) : null;

  const last4 = clean.match(/(?:terminad[ao] en|final(?:izada)? en|\*{2,}|x{2,}|•{2,})\s?(\d{4})\b/i)?.[1] ?? null;

  return { amount, currency, merchant, cardLast4: last4 };
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}
