import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, JwtBearerProvider, type JwtClaims } from '@nestjs/authentication';
import { PrismaService } from '../prisma/prisma.service.js';
import { AUTH_USER_SELECT, type AuthUser } from './auth.types.js';

/** Verifica el access token y carga al usuario en cada petición (un usuario borrado queda fuera al instante). */
@Injectable()
export class JwtAuth extends JwtBearerProvider<AuthUser> {
  constructor(
    private readonly prisma: PrismaService,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerProvider(this, { order: 1 });
  }

  validate({ sub }: JwtClaims) {
    if (!sub) return null;
    return this.prisma.user.findFirst({
      where: { id: sub, deletedAt: null },
      select: AUTH_USER_SELECT,
    });
  }
}
