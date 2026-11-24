import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { AuthUser } from '../auth/auth.types.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  summary(@CurrentUser() user: AuthUser) {
    return this.dashboard.summary(user.id);
  }
}
