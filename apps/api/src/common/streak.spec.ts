import { nextStreak } from './streak.js';

describe('nextStreak', () => {
  const now = new Date('2026-11-24T20:00:00-06:00');

  it('empieza en 1 sin registros previos', () => {
    expect(nextStreak(0, null, now)).toBe(1);
  });

  it('no cambia si ya registró hoy', () => {
    expect(nextStreak(5, new Date('2026-11-24T08:00:00-06:00'), now)).toBe(5);
  });

  it('suma uno si registró ayer', () => {
    expect(nextStreak(5, new Date('2026-11-23T22:00:00-06:00'), now)).toBe(6);
  });

  it('se reinicia tras un día sin registrar', () => {
    expect(nextStreak(5, new Date('2026-11-22T22:00:00-06:00'), now)).toBe(1);
  });
});
