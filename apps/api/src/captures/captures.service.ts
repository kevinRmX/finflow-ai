import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CryptoService } from '../common/crypto.service.js';
import { TransactionsService } from '../transactions/transactions.service.js';
import type { BankAlert } from './bank-alert.parser.js';

@Injectable()
export class CapturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly transactions: TransactionsService,
  ) {}

  /**
   * Guarda un gasto detectado como pendiente. Si el mismo gasto llega por
   * notificación y por correo (mismo monto, comercio y minuto), queda uno solo.
   */
  async add(userId: string, alert: BankAlert, source: 'NOTIFICATION' | 'EMAIL', occurredAt = new Date()) {
    const minute = new Date(Math.floor(occurredAt.getTime() / 60_000) * 60_000).toISOString();
    const dedupeKey = [alert.amount.toFixed(2), (alert.merchant ?? '').toLowerCase(), minute].join('|');
    return this.prisma.pendingCapture.upsert({
      where: { userId_dedupeKey: { userId, dedupeKey } },
      create: {
        userId,
        source,
        amount: alert.amount,
        currency: alert.currency,
        merchant: alert.merchant,
        cardLast4: alert.cardLast4,
        occurredAt,
        dedupeKey,
      },
      update: {},
    });
  }

  pending(userId: string) {
    return this.prisma.pendingCapture.findMany({
      where: { userId, status: 'PENDING' },
      orderBy: { occurredAt: 'desc' },
    });
  }

  async confirm(userId: string, id: string, input: { accountId?: string; categoryId?: string }) {
    const capture = await this.prisma.pendingCapture.findFirst({ where: { id, userId, status: 'PENDING' } });
    if (!capture) throw new NotFoundException('Gasto por confirmar no encontrado');
    const accountId = input.accountId ?? (await this.accountForCard(userId, capture.cardLast4));
    if (!accountId) throw new BadRequestException('Elige la cuenta con la que se pagó');

    const transaction = await this.transactions.create(
      userId,
      {
        type: 'EXPENSE',
        amount: Number(capture.amount),
        accountId,
        categoryId: input.categoryId,
        merchant: capture.merchant ?? undefined,
        date: capture.occurredAt,
      },
      capture.source,
    );
    await this.prisma.pendingCapture.update({ where: { id }, data: { status: 'CONFIRMED', transactionId: transaction.id } });
    return transaction;
  }

  async dismiss(userId: string, id: string) {
    const { count } = await this.prisma.pendingCapture.updateMany({ where: { id, userId, status: 'PENDING' }, data: { status: 'DISMISSED' } });
    if (!count) throw new NotFoundException('Gasto por confirmar no encontrado');
  }

  /** Busca la tarjeta del usuario por sus últimos 4 dígitos (guardados cifrados). */
  private async accountForCard(userId: string, last4: string | null) {
    if (!last4) return undefined;
    const cards = await this.prisma.account.findMany({
      where: { userId, last4Enc: { not: null }, isArchived: false },
      select: { id: true, last4Enc: true },
    });
    return cards.find((c) => c.last4Enc && this.crypto.decrypt(c.last4Enc) === last4)?.id;
  }
}
