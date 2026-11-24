import { randomBytes } from 'node:crypto';
import { CryptoService } from './crypto.service.js';

describe('CryptoService', () => {
  const key = randomBytes(32).toString('base64');

  it('cifra y descifra un valor', () => {
    const crypto = new CryptoService(key);
    const secret = crypto.encrypt('4821');
    expect(secret).not.toContain('4821');
    expect(crypto.decrypt(secret)).toBe('4821');
  });

  it('usa un IV distinto en cada cifrado', () => {
    const crypto = new CryptoService(key);
    expect(crypto.encrypt('hola')).not.toBe(crypto.encrypt('hola'));
  });

  it('rechaza un dato manipulado', () => {
    const crypto = new CryptoService(key);
    const parts = crypto.encrypt('nota privada').split(':');
    parts[3] = Buffer.from('otra cosa').toString('base64');
    expect(() => crypto.decrypt(parts.join(':'))).toThrow();
  });

  it('exige una clave de 32 bytes', () => {
    expect(() => new CryptoService(randomBytes(16).toString('base64'))).toThrow();
  });
});
