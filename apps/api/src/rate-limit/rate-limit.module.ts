import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// Se importa después de AuthenticationModule: así request.user ya existe y el límite es por usuario.
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: Number(process.env.THROTTLE_LIMIT ?? 100) }],
      getTracker: (req) => (req.user ? `user:${(req.user as { id: string }).id}` : `ip:${req.ip}`),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class RateLimitModule {}
