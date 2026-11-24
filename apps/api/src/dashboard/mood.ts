export type Mood = 'celebrando' | 'feliz' | 'tranquilo' | 'preocupado' | 'triste';

export interface MoodInput {
  income: number;
  expense: number;
  /** Porcentaje usado de cada presupuesto del mes (0-100+). */
  budgetUsage: number[];
  goalCompletedThisMonth: boolean;
  /** Hubo un gasto fuera de lo normal en los últimos días. */
  anomaly?: boolean;
}

/** Reglas del humor de la mascota, iguales a las del diseño. */
export function computeMood(input: MoodInput): Mood {
  const maxBudget = input.budgetUsage.length ? Math.max(...input.budgetUsage) : 0;
  if (input.goalCompletedThisMonth) return 'celebrando';
  if ((input.income > 0 && input.expense > input.income) || maxBudget > 100) return 'triste';
  if (maxBudget >= 90 || input.anomaly) return 'preocupado';
  if (maxBudget >= 80) return 'tranquilo';
  if (input.income === 0 && input.expense === 0) return 'tranquilo';
  if (input.income > 0 && input.expense / input.income < 0.8) return 'feliz';
  return 'tranquilo';
}
