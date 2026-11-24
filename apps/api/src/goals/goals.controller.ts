import { Body, Controller, Get, Module, NotFoundException, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

const createGoalSchema = z.object({
  name: z.string().trim().min(1).max(60),
  targetAmount: z.number().positive().max(1e10),
  targetDate: z.coerce.date().optional(),
  icon: z.string().max(40).optional(),
});
type CreateGoalInput = z.infer<typeof createGoalSchema>;

const contributeSchema = z.object({ amount: z.number().positive().max(1e10) });
type ContributeInput = z.infer<typeof contributeSchema>;

@Controller('goals')
export class GoalsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.goal.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body({ schema: createGoalSchema }) body: CreateGoalInput) {
    return this.prisma.goal.create({ data: { ...body, userId: user.id } });
  }

  /** Abona a una meta; al llegar al objetivo queda COMPLETED y la mascota celebra. */
  @Post(':id/contributions')
  contribute(
    @CurrentUser() user: AuthUser,
    @Param('id', { schema: z.uuid() }) id: string,
    @Body({ schema: contributeSchema }) body: ContributeInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const goal = await tx.goal.findFirst({ where: { id, userId: user.id } });
      if (!goal) throw new NotFoundException();
      await tx.goalContribution.create({ data: { goalId: id, amount: body.amount } });
      const saved = Number(goal.savedAmount) + body.amount;
      return tx.goal.update({
        where: { id },
        data: { savedAmount: saved, status: saved >= Number(goal.targetAmount) ? 'COMPLETED' : goal.status },
      });
    });
  }
}

@Module({ controllers: [GoalsController] })
export class GoalsModule {}
