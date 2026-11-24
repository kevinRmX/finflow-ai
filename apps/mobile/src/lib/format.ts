const SYMBOL: Record<string, string> = { GTQ: 'Q', USD: '$', MXN: '$', EUR: '€', COP: '$', HNL: 'L' };

/** Q1,234.50 — con el símbolo de la moneda del usuario. */
export function money(value: number | string, currency = 'GTQ') {
  const n = typeof value === 'string' ? Number(value) : value;
  const sign = n < 0 ? '-' : '';
  const body = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}${SYMBOL[currency] ?? currency + ' '}${body}`;
}

/** Color de una barra de presupuesto según los umbrales 80/90/100. */
export function budgetColor(percent: number) {
  if (percent >= 100) return '#FB7185';
  if (percent >= 80) return '#FBBF24';
  return '#22C1A8';
}
