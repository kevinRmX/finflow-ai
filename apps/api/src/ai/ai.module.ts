import { Module } from '@nestjs/common';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { GeminiClient } from './gemini.client.js';

@Module({
  imports: [TransactionsModule],
  controllers: [AiController],
  providers: [AiService, GeminiClient],
})
export class AiModule {}
