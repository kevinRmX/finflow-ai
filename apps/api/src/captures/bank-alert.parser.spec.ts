import { parseBankAlert } from './bank-alert.parser.js';

describe('parseBankAlert', () => {
  it('lee una alerta típica de compra con tarjeta', () => {
    expect(parseBankAlert('BAC Credomatic: Compra por Q250.00 en PUMA ZONA 10 con tarjeta terminada en 4821')).toEqual({
      amount: 250,
      currency: 'GTQ',
      merchant: 'Puma Zona 10',
      cardLast4: '4821',
    });
  });

  it('entiende montos en dólares y con comas', () => {
    expect(parseBankAlert('Consumo aprobado USD 1,200.50 en AMAZON MKTPLACE. Tarjeta ****1190')).toMatchObject({
      amount: 1200.5,
      currency: 'USD',
      merchant: 'Amazon Mktplace',
      cardLast4: '1190',
    });
  });

  it('ignora transacciones rechazadas', () => {
    expect(parseBankAlert('Compra rechazada por Q99.00 en NETFLIX')).toBeNull();
  });

  it('ignora mensajes que no son compras', () => {
    expect(parseBankAlert('Tu código de verificación es 482193')).toBeNull();
  });
});

describe('parseBankAlert con texto malicioso', () => {
  it('termina rápido con miles de comas', () => {
    const start = performance.now();
    expect(parseBankAlert('compra ' + '1,'.repeat(20_000))).toBeNull();
    expect(performance.now() - start).toBeLessThan(100);
  });
});
