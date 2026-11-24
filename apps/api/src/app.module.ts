import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { createObserveModule } from '@nestjs/observe';
import { AccountsModule } from './accounts/accounts.module.js';
import { AiModule } from './ai/ai.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BudgetsModule } from './budgets/budgets.controller.js';
import { CapturesModule } from './captures/captures.module.js';
import { CategoriesModule } from './categories/categories.controller.js';
import { CommonModule } from './common/common.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { GoalsModule } from './goals/goals.controller.js';
import { HealthModule } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RateLimitModule } from './rate-limit/rate-limit.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Trazas, errores y métricas en NestJS Observe. Sin OBSERVE_APP_KEY no envía nada.
    ObserveModule.forRoot({
      enabled: process.env.NODE_ENV === 'production',
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'finflow-api',
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    AuthenticationModule.forRoot({
      accessToken: { key: process.env.JWT_SECRET!, ttl: '15m' },
      refreshToken: { ttl: '30d', absoluteTtl: '90d' },
    }),
    RateLimitModule, // después de AuthenticationModule: límite por usuario
    PrismaModule,
    CommonModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    GoalsModule,
    DashboardModule,
    AiModule,
    CapturesModule,
  ],
})
export class AppModule {}
