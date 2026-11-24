import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { round2 } from '../common/money.js';
import { computeMood } from './mood.js';

function monthRange(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Todo lo que pinta la pantalla de inicio en una sola llamada. */
  async summary(userId: string, now = new Date()) {
    const { start, end } = monthRange(now);
    const baseWhere = { userId, deletedAt: null, date: { gte: start, lt: end } };

    const [user, accounts, totals, byCategory, budgets, goals, pendingCaptures, recent, completedNow] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { name: true, currency: true, mascot: true, mascotStage: true, streakDays: true, plan: true },
      }),
      this.prisma.account.findMany({
        where: { userId, isArchived: false },
        select: { id: true, name: true, type: true, balance: true, currency: true },
      }),
      this.prisma.transaction.groupBy({ by: ['type'], where: baseWhere, _sum: { amount: true } }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { ...baseWhere, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      this.prisma.budget.findMany({
        where: { userId, startDate: { lte: now } },
        include: { category: { select: { name: true, icon: true, color: true } } },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.pendingCapture.count({ where: { userId, status: 'PENDING' } }),
      this.prisma.transaction.findMany({
        where: { userId, deletedAt: null },
        orderBy: { date: 'desc' },
        take: 5,
        include: { category: { select: { name: true, icon: true, color: true } } },
      }),
      // Una meta completada con un abono de este mes hace celebrar a la mascota.
      this.prisma.goalContribution.count({
        where: { date: { gte: start, lt: end }, goal: { userId, status: 'COMPLETED' } },
      }),
    ]);

    const sumOf = (type: string) => Number(totals.find((t) => t.type === type)?._sum.amount ?? 0);
    const income = sumOf('INCOME');
    const expense = sumOf('EXPENSE');
    const spentByCategory = new Map(byCategory.map((c) => [c.categoryId, Number(c._sum.amount ?? 0)]));

    // Un presupuesto por categoría: el más reciente.
    const seen = new Set<string>();
    const budgetRows = budgets
      .filter((b) => (seen.has(b.categoryId) ? false : (seen.add(b.categoryId), true)))
      .map((b) => {
        const limit = Number(b.amount);
        const spent = spentByCategory.get(b.categoryId) ?? 0;
        return {
          id: b.id,
          category: b.category,
          limit,
          spent: round2(spent),
          percent: limit > 0 ? Math.round((spent / limit) * 100) : 0,
        };
      });

    const goalCompletedThisMonth = completedNow > 0;
    const mood = computeMood({
      income,
      expense,
      budgetUsage: budgetRows.map((b) => b.percent),
      goalCompletedThisMonth,
    });

    return {
      user,
      mood,
      month: { income: round2(income), expense: round2(expense), balance: round2(income - expense) },
      totalBalance: round2(accounts.reduce((acc, a) => acc + Number(a.balance), 0)),
      accounts,
      budgets: budgetRows,
      goals: goals.map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        status: g.status,
        target: Number(g.targetAmount),
        saved: Number(g.savedAmount),
        percent: Number(g.targetAmount) > 0 ? Math.round((Number(g.savedAmount) / Number(g.targetAmount)) * 100) : 0,
      })),
      pendingCaptures,
      recent,
    };
  }
}
