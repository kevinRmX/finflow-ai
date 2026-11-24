import { Injectable } from '@nestjs/common';
import {
  AuthenticationStorage,
  type RefreshTokenRecord,
  type RefreshTokenStore,
} from '@nestjs/authentication';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';

/** Guarda los refresh tokens en PostgreSQL para que sobrevivan reinicios del servidor. */
@Injectable()
export class PrismaRefreshTokenStore implements RefreshTokenStore {
  constructor(
    private readonly prisma: PrismaService,
    storage: AuthenticationStorage,
  ) {
    storage.registerSource({ refreshTokens: this });
  }

  async getRefreshToken(id: string): Promise<RefreshTokenRecord | undefined> {
    const row = await this.prisma.refreshToken.findUnique({ where: { id } });
    if (!row) return undefined;
    return {
      id: row.id,
      familyId: row.familyId,
      userId: row.userId,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      familyExpiresAt: row.familyExpiresAt,
      usedAt: row.usedAt ?? undefined,
      claims: (row.claims as Record<string, unknown> | null) ?? undefined,
    };
  }

  async saveRefreshToken(record: RefreshTokenRecord): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { familyExpiresAt: { lt: record.createdAt } } }),
      this.prisma.refreshToken.create({
        data: {
          id: record.id,
          familyId: record.familyId,
          userId: record.userId,
          createdAt: record.createdAt,
          expiresAt: record.expiresAt,
          familyExpiresAt: record.familyExpiresAt,
          usedAt: record.usedAt ?? null,
          claims: (record.claims as Prisma.InputJsonValue | undefined) ?? undefined,
        },
      }),
    ]);
  }

  /** Una sola escritura condicional: de varias llamadas simultáneas solo una gana. */
  async markRefreshTokenUsed(id: string, at: Date): Promise<boolean> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: at },
    });
    return count === 1;
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await this.prisma.revokedTokenFamily.upsert({
      where: { familyId },
      create: { familyId },
      update: {},
    });
  }

  async isRefreshTokenFamilyRevoked(familyId: string): Promise<boolean> {
    const row = await this.prisma.revokedTokenFamily.findUnique({ where: { familyId } });
    return row !== null;
  }

  async revokeUserRefreshTokens(userId: string): Promise<void> {
    const families = await this.prisma.refreshToken.findMany({
      where: { userId },
      distinct: ['familyId'],
      select: { familyId: true },
    });
    if (families.length === 0) return;
    await this.prisma.revokedTokenFamily.createMany({
      data: families.map((f) => ({ familyId: f.familyId })),
      skipDuplicates: true,
    });
  }
}
