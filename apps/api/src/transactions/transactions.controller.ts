import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { TransactionsService } from './transactions.service.js';
import {
  createTransactionSchema,
  listTransactionsSchema,
  updateCategorySchema,
  type CreateTransactionInput,
  type ListTransactionsInput,
  type UpdateCategoryInput,
} from './transactions.schemas.js';

const idSchema = z.uuid();

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query({ schema: listTransactionsSchema }) q: ListTransactionsInput) {
    return this.transactions.list(user.id, q);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body({ schema: createTransactionSchema }) body: CreateTransactionInput) {
    return this.transactions.create(user.id, body);
  }

  @Patch(':id/category')
  updateCategory(
    @CurrentUser() user: AuthUser,
    @Param('id', { schema: idSchema }) id: string,
    @Body({ schema: updateCategorySchema }) body: UpdateCategoryInput,
  ) {
    return this.transactions.updateCategory(user.id, id, body.categoryId);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', { schema: idSchema }) id: string) {
    return this.transactions.remove(user.id, id);
  }
}
