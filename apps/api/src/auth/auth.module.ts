import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { CredentialsService } from './credentials.service.js';
import { JwtAuth } from './jwt-auth.provider.js';
import { PrismaRefreshTokenStore } from './prisma-refresh-token.store.js';

@Module({
  controllers: [AuthController],
  providers: [CredentialsService, JwtAuth, PrismaRefreshTokenStore],
})
export class AuthModule {}
