import { Controller, Get, Module } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { AuthUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  /** Categorías del sistema más las propias del usuario. */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId: user.id }] },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }
}

@Module({ controllers: [CategoriesController] })
export class CategoriesModule {}
