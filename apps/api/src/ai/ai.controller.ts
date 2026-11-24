import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { AiService } from './ai.service.js';

const chatSchema = z.object({ text: z.string().trim().min(1).max(500) });
type ChatInput = z.infer<typeof chatSchema>;

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  @HttpCode(200)
  chat(@CurrentUser() user: AuthUser, @Body({ schema: chatSchema }) body: ChatInput) {
    return this.ai.chat(user, body.text);
  }

  @Get('history')
  history(@CurrentUser() user: AuthUser) {
    return this.ai.history(user.id);
  }
}
