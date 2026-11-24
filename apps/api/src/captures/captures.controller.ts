import { Body, Controller, Get, Headers, HttpCode, Param, Post, UnauthorizedException } from '@nestjs/common';
import { CurrentUser, Public } from '@nestjs/authentication';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CapturesService } from './captures.service.js';
import { parseBankAlert } from './bank-alert.parser.js';

const idSchema = z.uuid();

/** Lo que manda la app Android: ya leído en el teléfono, sin el texto completo de la notificación. */
const deviceCaptureSchema = z.object({
  amount: z.number().positive().max(10_000_000),
  currency: z.enum(['GTQ', 'USD']).default('GTQ'),
  merchant: z.string().trim().max(120).nullable().default(null),
  cardLast4: z.string().regex(/^\d{4}$/).nullable().default(null),
  occurredAt: z.coerce.date(),
});
type DeviceCaptureInput = z.infer<typeof deviceCaptureSchema>;

const confirmSchema = z.object({ accountId: z.uuid().optional(), categoryId: z.uuid().optional() });
type ConfirmInput = z.infer<typeof confirmSchema>;

const inboundEmailSchema = z.object({
  to: z.string().max(320),
  text: z.string().max(20_000),
  receivedAt: z.coerce.date().optional(),
});
type InboundEmailInput = z.infer<typeof inboundEmailSchema>;

@Controller()
export class CapturesController {
  constructor(
    private readonly captures: CapturesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('captures')
  add(@CurrentUser() user: AuthUser, @Body({ schema: deviceCaptureSchema }) body: DeviceCaptureInput) {
    const { occurredAt, ...alert } = body;
    return this.captures.add(user.id, alert, 'NOTIFICATION', occurredAt);
  }

  @Get('captures/pending')
  pending(@CurrentUser() user: AuthUser) {
    return this.captures.pending(user.id);
  }

  @Post('captures/:id/confirm')
  @HttpCode(200)
  confirm(@CurrentUser() user: AuthUser, @Param('id', { schema: idSchema }) id: string, @Body({ schema: confirmSchema }) body: ConfirmInput) {
    return this.captures.confirm(user.id, id, body);
  }

  @Post('captures/:id/dismiss')
  @HttpCode(204)
  dismiss(@CurrentUser() user: AuthUser, @Param('id', { schema: idSchema }) id: string) {
    return this.captures.dismiss(user.id, id);
  }

  /** Lo llama el Email Worker de Cloudflare con cada alerta reenviada por el usuario. */
  @Public()
  @Post('webhooks/inbound-email')
  @HttpCode(202)
  async inboundEmail(@Headers('x-webhook-secret') secret: string | undefined, @Body({ schema: inboundEmailSchema }) body: InboundEmailInput) {
    if (!isValidSecret(secret, process.env.INBOUND_EMAIL_SECRET)) throw new UnauthorizedException();
    const alias = body.to.split('@')[0]?.toLowerCase();
    const user = alias ? await this.prisma.user.findUnique({ where: { inboundAlias: alias }, select: { id: true } }) : null;
    const alert = parseBankAlert(body.text);
    // Misma respuesta si el alias no existe o el correo no es una compra: no revela qué alias son válidos.
    if (user && alert) await this.captures.add(user.id, alert, 'EMAIL', body.receivedAt ?? new Date());
    return { accepted: true };
  }
}

function isValidSecret(given: string | undefined, expected: string | undefined) {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
