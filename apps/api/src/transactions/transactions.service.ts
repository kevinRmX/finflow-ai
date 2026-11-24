import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { TxSource } from '../generated/prisma/client.js';
import { nextStreak } from '../common/streak.js';
import type { CreateTransactionInput, ListTransactionsInput } from './transactions.schemas.js';

export const merchantKey = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, q: ListTransactionsInput) {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        accountId: q.accountId,
        categoryId: q.categoryId,
        date: { gte: q.from, lte: q.to },
      },
      include: { category: true, merchant: true, account: { select: { id: true, name: true, type: true } } },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take: q.limit,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
  }

  /** Crea el movimiento, actualiza saldos y la racha, todo en una sola transacción de base de datos. */
  async create(userId: string, input: CreateTransactionInput, source: TxSource = 'MANUAL', aiConfidence?: number) {
    const accountIds = [input.accountId, input.toAccountId].filter((x): x is string => !!x);
    const owned = await this.prisma.account.count({ where: { id: { in: accountIds }, userId } });
    if (owned !== accountIds.length) throw new NotFoundException('Cuenta no encontrada');
    if (input.categoryId) await this.assertCategory(userId, input.categoryId);

    const merchant = input.merchant
      ? await this.prisma.merchant.upsert({
          where: { name: input.merchant },
          create: { name: input.merchant },
          update: {},
        })
      : null;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          userId,
          type: input.type,
          amount: input.amount,
          taxAmount: input.taxAmount,
          date: input.date ?? new Date(),
          description: input.description,
          source,
          aiConfidence,
          accountId: input.accountId,
          toAccountId: input.toAccountId,
          categoryId: input.categoryId,
          merchantId: merchant?.id,
        },
        include: { category: true, merchant: true, account: { select: { id: true, name: true, type: true } } },
      });

      const sign = input.type === 'INCOME' ? 1 : -1;
      await tx.account.update({
        where: { id: input.accountId },
        data: { balance: { increment: sign * input.amount } },
      });
      if (input.type === 'TRANSFER' && input.toAccountId) {
        await tx.account.update({
          where: { id: input.toAccountId },
          data: { balance: { increment: input.amount } },
        });
      }

      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { streakDays: true, lastEntryAt: true } });
      const now = new Date();
      await tx.user.update({
        where: { id: userId },
        data: { streakDays: nextStreak(user.streakDays, user.lastEntryAt, now), lastEntryAt: now },
      });
      await tx.auditLog.create({
        data: { userId, action: 'TX_CREATE', entity: 'Transaction', entityId: created.id, meta: { source } },
      });
      return created;
    });
  }

  /** Cambia la categoría y lo recuerda para ese comercio: así la IA aprende de cada usuario. */
  async updateCategory(userId: string, id: string, categoryId: string) {
    await this.assertCategory(userId, categoryId);
    const found = await this.prisma.transaction.findFirst({
      where: { id, userId, deletedAt: null },
      include: { merchant: true },
    });
    if (!found) throw new NotFoundException('Movimiento no encontrado');

    return this.prisma.$transaction(async (tx) => {
      if (found.merchant) {
        const key = merchantKey(found.merchant.name);
        await tx.merchantRule.upsert({
          where: { userId_merchantKey: { userId, merchantKey: key } },
          create: { userId, merchantKey: key, categoryId },
          update: { categoryId, hits: { increment: 1 } },
        });
      }
      return tx.transaction.update({ where: { id }, data: { categoryId }, include: { category: true, merchant: true } });
    });
  }

  /** Borrado lógico: revierte el efecto en los saldos. */
  async remove(userId: string, id: string) {
    const found = await this.prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });
    if (!found) throw new NotFoundException('Movimiento no encontrado');
    const amount = Number(found.amount);
    const sign = found.type === 'INCOME' ? -1 : 1;
    await this.prisma.$transaction([
      this.prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } }),
      this.prisma.account.update({ where: { id: found.accountId }, data: { balance: { increment: sign * amount } } }),
      ...(found.type === 'TRANSFER' && found.toAccountId
        ? [this.prisma.account.update({ where: { id: found.toAccountId }, data: { balance: { decrement: amount } } })]
        : []),
      this.prisma.auditLog.create({ data: { userId, action: 'TX_DELETE', entity: 'Transaction', entityId: id } }),
    ]);
  }

  private async assertCategory(userId: string, categoryId: string) {
    const ok = await this.prisma.category.count({
      where: { id: categoryId, OR: [{ userId }, { userId: null }] },
    });
    if (!ok) throw new BadRequestException('Categoría no válida');
  }
}
