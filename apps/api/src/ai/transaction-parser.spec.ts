import { anonymize, localParse, parsedTransactionSchema } from './transaction-parser.js';

const today = '2026-11-24';

describe('anonymize', () => {
  it('oculta correos y números de cuenta', () => {
    const out = anonymize('Pagué con la cuenta 1234567890 y mi correo es ana@mail.com');
    expect(out).not.toContain('1234567890');
    expect(out).not.toContain('ana@mail.com');
  });

  it('conserva montos cortos', () => {
    expect(anonymize('Compré gasolina por Q250')).toContain('Q250');
  });
});

describe('localParse', () => {
  it('entiende el ejemplo principal', () => {
    const r = localParse('Compré gasolina en Puma por Q250 con tarjeta BAC', today, ['Tarjeta BAC', 'Efectivo']);
    expect(r).toMatchObject({
      operation: 'EXPENSE',
      amount: 250,
      category: 'Transporte',
      merchant: 'Puma',
      account: 'Tarjeta BAC',
      date: today,
    });
    expect(parsedTransactionSchema.parse(r)).toBeTruthy();
  });

  it('detecta un ingreso', () => {
    const r = localParse('Me pagaron Q6000 de salario', today);
    expect(r.operation).toBe('INCOME');
    expect(r.amount).toBe(6000);
    expect(r.category).toBe('Salario');
  });

  it('entiende montos con comas y la palabra ayer', () => {
    const r = localParse('Ayer compré en Walmart Q1,250.50', today);
    expect(r.amount).toBe(1250.5);
    expect(r.merchant).toBe('Walmart');
    expect(r.date).toBe('2026-11-23');
  });

  it('pide el monto cuando falta', () => {
    const r = localParse('Compré almuerzo', today);
    expect(r.amount).toBeNull();
    expect(r.missing).toContain('amount');
  });
});
