import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';

/**
 * Cifra campos sensibles (últimos 4 dígitos, notas, tokens bancarios) con
 * AES-256-GCM. La clave vive en DATA_ENCRYPTION_KEY (32 bytes en base64).
 * Formato: v1:<iv>:<tag>:<cifrado>, todo en base64.
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(keyBase64 = process.env.DATA_ENCRYPTION_KEY) {
    if (!keyBase64) {
      throw new Error('DATA_ENCRYPTION_KEY no está configurada');
    }
    this.key = Buffer.from(keyBase64, 'base64');
    if (this.key.length !== 32) {
      throw new Error('DATA_ENCRYPTION_KEY debe tener 32 bytes (openssl rand -base64 32)');
    }
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [VERSION, iv.toString('base64'), tag.toString('base64'), data.toString('base64')].join(':');
  }

  decrypt(payload: string): string {
    const [version, iv, tag, data] = payload.split(':');
    if (version !== VERSION || !iv || !tag || !data) {
      throw new Error('Formato de dato cifrado no válido');
    }
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  }
}
