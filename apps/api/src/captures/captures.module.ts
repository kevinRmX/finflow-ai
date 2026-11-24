import { Module } from '@nestjs/common';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { CapturesController } from './captures.controller.js';
import { CapturesService } from './captures.service.js';

@Module({
  imports: [TransactionsModule],
  controllers: [CapturesController],
  providers: [CapturesService],
})
export class CapturesModule {}
