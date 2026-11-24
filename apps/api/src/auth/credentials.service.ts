import { ConflictException, Injectable } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { AUTH_USER_SELECT, type AuthUser } from './auth.types.js';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async register(input: { name: string; email: string; password: string; currency?: string; locale?: string }): Promise<AuthUser> {
    const passwordHash = await this.passwordHasher.hash(input.password);
    try {
      return await this.prisma.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash,
          currency: input.currency ?? 'GTQ',
          locale: input.locale ?? 'es',
          accounts: { create: { name: 'Efectivo', type: 'CASH' } },
        },
        select: AUTH_USER_SELECT,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe una cuenta con ese correo');
      }
      throw error;
    }
  }

  /** El usuario, o null si el correo o la contraseña no coinciden. Mismo tiempo de respuesta en ambos casos. */
  async verify(email: string, password: string): Promise<AuthUser | null> {
    const found = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      select: { ...AUTH_USER_SELECT, passwordHash: true },
    });
    const valid = await this.passwordHasher.verify(password, found?.passwordHash ?? undefined);
    if (!valid || !found) return null;
    const { passwordHash, ...user } = found;
    if (passwordHash && this.passwordHasher.needsRehash(passwordHash)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await this.passwordHasher.hash(password) },
      });
    }
    return user;
  }
}
