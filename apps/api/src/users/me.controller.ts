import { Body, Controller, Delete, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { CurrentUser, TokenService } from '@nestjs/authentication';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { nextStreak } from '../common/streak.js';

const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  currency: z.string().length(3).optional(),
  country: z.string().length(2).optional(),
  locale: z.enum(['es', 'en']).optional(),
  mascot: z.enum(['flo', 'coco', 'leo', 'balam']).optional(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  adsPersonalized: z.boolean().optional(),
});
type UpdateMeInput = z.infer<typeof updateMeSchema>;

const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  currency: true,
  country: true,
  locale: true,
  plan: true,
  mascot: true,
  mascotStage: true,
  streakDays: true,
  reminderTime: true,
  adsPersonalized: true,
} as const;

@Controller('me')
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: PROFILE_SELECT });
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body({ schema: updateMeSchema }) body: UpdateMeInput) {
    return this.prisma.user.update({ where: { id: user.id }, data: body, select: PROFILE_SELECT });
  }

  /** Dirección única para reenviar los correos de alertas del banco. */
  @Get('inbound-address')
  async inboundAddress(@CurrentUser() user: AuthUser) {
    let { inboundAlias } = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { inboundAlias: true } });
    if (!inboundAlias) {
      inboundAlias = `gastos-${randomBytes(5).toString('hex')}`;
      await this.prisma.user.update({ where: { id: user.id }, data: { inboundAlias } });
    }
    return { address: `${inboundAlias}@${process.env.INBOUND_EMAIL_DOMAIN ?? 'example.com'}` };
  }

  /** "Hoy no gasté": mantiene viva la racha sin registrar un movimiento. */
  @Post('no-spend')
  @HttpCode(200)
  async noSpend(@CurrentUser() user: AuthUser) {
    const found = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { streakDays: true, lastEntryAt: true } });
    const now = new Date();
    return this.prisma.user.update({
      where: { id: user.id },
      data: { streakDays: nextStreak(found.streakDays, found.lastEntryAt, now), lastEntryAt: now },
      select: { streakDays: true },
    });
  }

  /** Borra la cuenta y todos sus datos (Apple y Google lo exigen). */
  @Delete()
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser) {
    await this.tokens.revokeAll(user.id);
    await this.prisma.$transaction([
      this.prisma.auditLog.create({ data: { action: 'ACCOUNT_DELETE', entity: 'User', entityId: user.id } }),
      this.prisma.transaction.deleteMany({ where: { userId: user.id } }),
      this.prisma.user.delete({ where: { id: user.id } }),
    ]);
  }
}
