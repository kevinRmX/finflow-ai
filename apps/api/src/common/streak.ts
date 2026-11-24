/** Fecha local (YYYY-MM-DD) en la zona horaria del usuario. */
export function localDay(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/**
 * Racha de días registrando. Mismo día: no cambia. Día siguiente: suma uno.
 * Más de un día sin registrar: vuelve a empezar en 1.
 */
export function nextStreak(current: number, lastEntryAt: Date | null, now: Date, timeZone = 'America/Guatemala'): number {
  if (!lastEntryAt) return 1;
  const last = localDay(lastEntryAt, timeZone);
  const today = localDay(now, timeZone);
  if (last === today) return Math.max(current, 1);
  const yesterday = localDay(new Date(now.getTime() - 24 * 60 * 60 * 1000), timeZone);
  return last === yesterday ? current + 1 : 1;
}
