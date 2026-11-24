import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TransactionsService, merchantKey } from '../transactions/transactions.service.js';
import { localDay } from '../common/streak.js';
import type { AuthUser } from '../auth/auth.types.js';
import { GeminiClient } from './gemini.client.js';
import { anonymize, localParse, type ParsedTransaction } from './transaction-parser.js';

const AUTO_SAVE_CONFIDENCE = 0.85;
const TIME_ZONE = process.env.APP_TIME_ZONE ?? 'America/Guatemala';

@Injectable()
export class AiService {
  private readonly dailyLimit = Number(process.env.AI_DAILY_LIMIT ?? 30);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiClient,
    private readonly transactions: TransactionsService,
  ) {}

  async chat(user: AuthUser, text: string) {
    await this.assertDailyLimit(user.id);

    const [accounts, categories] = await Promise.all([
      this.prisma.account.findMany({ where: { userId: user.id, isArchived: false }, select: { id: true, name: true, type: true } }),
      this.prisma.category.findMany({ where: { OR: [{ userId: user.id }, { userId: null }] }, select: { id: true, name: true, type: true } }),
    ]);
    const today = localDay(new Date(), TIME_ZONE);
    const accountNames = accounts.map((a) => a.name);
    const safeText = anonymize(text);

    const local = localParse(safeText, today, accountNames);
    // Los casos simples y claros se resuelven sin gastar cuota de IA.
    const parsed: ParsedTransaction =
      local.confidence >= 0.9 && local.missing.length === 0
        ? local
        : ((await this.gemini.parse(safeText, {
            today,
            currency: user.currency,
            accounts: accountNames,
            categories: categories.map((c) => c.name),
          })) ?? local);

    await this.applyLearnedCategory(user.id, parsed);

    const userMessage = await this.prisma.aiMessage.create({
      data: { userId: user.id, role: 'user', content: safeText, parsed, model: this.gemini.enabled ? 'gemini' : 'local' },
    });

    const account =
      accounts.find((a) => a.name.toLowerCase() === parsed.account?.toLowerCase()) ??
      (parsed.account ? undefined : accounts.find((a) => a.type === 'CASH'));

    if (!parsed.amount || parsed.operation === 'UNKNOWN') {
      return this.reply(user.id, '¿Cuánto fue? Escribe el monto, por ejemplo "Q120".', parsed);
    }
    if (!account) {
      return this.reply(user.id, `¿Con qué cuenta pagaste? Tienes: ${accountNames.join(', ')}.`, parsed);
    }
    if (parsed.confidence < AUTO_SAVE_CONFIDENCE || parsed.operation === 'TRANSFER') {
      return this.reply(user.id, 'Revisa los datos y confirma para guardarlo.', parsed, { needsConfirmation: true, accountId: account.id });
    }

    const category = categories.find(
      (c) => c.name.toLowerCase() === parsed.category?.toLowerCase() && c.type === parsed.operation,
    );
    const transaction = await this.transactions.create(
      user.id,
      {
        type: parsed.operation,
        amount: parsed.amount,
        accountId: account.id,
        categoryId: category?.id,
        merchant: parsed.merchant ?? undefined,
        date: parsed.date ? new Date(`${parsed.date}T12:00:00Z`) : undefined,
        taxAmount: parsed.taxAmount ?? undefined,
      },
      'AI_CHAT',
      parsed.confidence,
    );
    await this.prisma.aiMessage.update({ where: { id: userMessage.id }, data: { transactionId: transaction.id } });

    const text_ =
      parsed.operation === 'INCOME'
        ? 'Excelente, registré tu ingreso.'
        : `Listo, lo registré como gasto${category ? ` de ${category.name.toLowerCase()}` : ''}.`;
    return this.reply(user.id, text_, parsed, { transaction });
  }

  /** Si el usuario ya corrigió la categoría de este comercio, se usa la suya. */
  private async applyLearnedCategory(userId: string, parsed: ParsedTransaction) {
    if (!parsed.merchant) return;
    const rule = await this.prisma.merchantRule.findUnique({
      where: { userId_merchantKey: { userId, merchantKey: merchantKey(parsed.merchant) } },
      include: { category: true },
    });
    if (rule) parsed.category = rule.category.name;
  }

  private async reply(userId: string, text: string, parsed: ParsedTransaction, extra: Record<string, unknown> = {}) {
    await this.prisma.aiMessage.create({ data: { userId, role: 'assistant', content: text } });
    return { reply: text, parsed, ...extra };
  }

  private async assertDailyLimit(userId: string) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const used = await this.prisma.aiMessage.count({ where: { userId, role: 'user', createdAt: { gte: since } } });
    if (used >= this.dailyLimit) {
      throw new HttpException(
        { statusCode: 429, errorCode: 'AI_DAILY_LIMIT', message: 'Llegaste al límite diario de mensajes a la IA. Puedes registrar a mano.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  history(userId: string) {
    return this.prisma.aiMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, role: true, content: true, transactionId: true, createdAt: true },
    });
  }
}
