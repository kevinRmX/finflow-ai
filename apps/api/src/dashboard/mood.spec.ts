import { computeMood } from './mood.js';

describe('computeMood', () => {
  const base = { income: 6000, expense: 3845, budgetUsage: [50, 76], goalCompletedThisMonth: false };

  it('celebra cuando se completa una meta', () => {
    expect(computeMood({ ...base, goalCompletedThisMonth: true })).toBe('celebrando');
  });

  it('está feliz si gasta menos del 80% y los presupuestos van bien', () => {
    expect(computeMood(base)).toBe('feliz');
  });

  it('está tranquilo con un presupuesto entre 80% y 90%', () => {
    expect(computeMood({ ...base, budgetUsage: [85] })).toBe('tranquilo');
  });

  it('se preocupa con un presupuesto en 90% o más', () => {
    expect(computeMood({ ...base, budgetUsage: [92] })).toBe('preocupado');
  });

  it('se pone triste si gasta más de lo que gana', () => {
    expect(computeMood({ ...base, expense: 7000 })).toBe('triste');
  });

  it('se pone triste si se pasa de un presupuesto', () => {
    expect(computeMood({ ...base, budgetUsage: [107] })).toBe('triste');
  });
});
