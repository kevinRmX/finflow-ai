import { StandardSchemaValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Arranca la app completa con la base de datos simulada: prueba el cableado
// (prefijo, guard global de autenticación, validación), no las consultas.
describe('FinFlow API (e2e)', () => {
  let app: INestApplication<App>;
  const prisma = { $queryRaw: vi.fn(), $disconnect: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'ready'] });
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health responde sin sesión', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok' });
  });

  it('GET /ready responde 503 si la base de datos no contesta', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('down'));
    await request(app.getHttpServer()).get('/ready').expect(503);
  });

  it('las rutas privadas piden token', () => {
    return request(app.getHttpServer()).get('/api/v1/dashboard').expect(401);
  });

  it('el registro valida el cuerpo antes de tocar la base de datos', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'no-es-correo', password: '123' })
      .expect(400);
  });
});
