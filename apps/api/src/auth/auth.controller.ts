import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { Public, TokenService } from '@nestjs/authentication';
import { Throttle } from '@nestjs/throttler';
import { CredentialsService } from './credentials.service.js';
import {
  credentialsSchema,
  refreshSchema,
  registerSchema,
  type CredentialsInput,
  type RefreshInput,
  type RegisterInput,
} from './auth.schemas.js';

@Public()
@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(
    private readonly credentials: CredentialsService,
    private readonly tokens: TokenService,
  ) {}

  @Post('register')
  async register(@Body({ schema: registerSchema }) body: RegisterInput) {
    const user = await this.credentials.register(body);
    const tokens = await this.tokens.issue(user.id, { method: 'password' });
    return { user, ...tokens };
  }

  @Post('token')
  @HttpCode(200)
  async signIn(@Body({ schema: credentialsSchema }) body: CredentialsInput) {
    const user = await this.credentials.verify(body.email, body.password);
    if (!user) throw new UnauthorizedException('Correo o contraseña incorrectos');
    const tokens = await this.tokens.issue(user.id, { method: 'password' });
    return { user, ...tokens };
  }

  @Post('token/refresh')
  @HttpCode(200)
  refresh(@Body({ schema: refreshSchema }) body: RefreshInput) {
    return this.tokens.refresh(body.refreshToken);
  }

  @Post('token/revoke')
  @HttpCode(204)
  async revoke(@Body({ schema: refreshSchema }) body: RefreshInput) {
    await this.tokens.revoke(body.refreshToken);
  }
}
