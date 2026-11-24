import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CryptoService } from '../common/crypto.service.js';

const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(60),
  type: z.enum(['CASH', 'SAVINGS', 'CREDIT_CARD', 'DEBIT_CARD']),
  institution: z.string().trim().max(60).optional(),
  last4: z.string().regex(/^\d{4}$/).optional(),
  balance: z.number().default(0),
  creditLimit: z.number().positive().optional(),
  paymentDueDay: z.number().int().min(1).max(31).optional(),
});
type CreateAccountInput = z.infer<typeof createAccountSchema>;

const ACCOUNT_SELECT = {
  id: true,
  name: true,
  type: true,
  institution: true,
  currency: true,
  balance: true,
  creditLimit: true,
  paymentDueDay: true,
} as const;

@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.account.findMany({
      where: { userId: user.id, isArchived: false },
      select: ACCOUNT_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body({ schema: createAccountSchema }) body: CreateAccountInput) {
    const { last4, ...rest } = body;
    return this.prisma.account.create({
      data: { ...rest, userId: user.id, currency: user.currency, last4Enc: last4 ? this.crypto.encrypt(last4) : undefined },
      select: ACCOUNT_SELECT,
    });
  }
}
