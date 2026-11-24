import { Body, Controller, Delete, Get, HttpCode, Module, NotFoundException, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

const upsertBudgetSchema = z.object({
  categoryId: z.uuid(),
  amount: z.number().positive().max(1e10),
});
type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;

function firstOfMonth(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.budget.findMany({
      where: { userId: user.id, startDate: firstOfMonth() },
      include: { category: true },
    });
  }

  /** Crea o cambia el presupuesto del mes para una categoría. */
  @Post()
  upsert(@CurrentUser() user: AuthUser, @Body({ schema: upsertBudgetSchema }) body: UpsertBudgetInput) {
    const startDate = firstOfMonth();
    return this.prisma.budget.upsert({
      where: {
        userId_categoryId_period_startDate: { userId: user.id, categoryId: body.categoryId, period: 'MONTHLY', startDate },
      },
      create: { userId: user.id, categoryId: body.categoryId, amount: body.amount, startDate },
      update: { amount: body.amount, lastAlertAt: null },
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id', { schema: z.uuid() }) id: string) {
    const { count } = await this.prisma.budget.deleteMany({ where: { id, userId: user.id } });
    if (!count) throw new NotFoundException();
  }
}

@Module({ controllers: [BudgetsController] })
export class BudgetsModule {}
