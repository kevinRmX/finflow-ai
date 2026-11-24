// Categorías del sistema (userId = null). Se puede correr varias veces sin duplicar.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const categories = [
  // Gastos
  { name: 'Comida', icon: 'utensils', color: '#F97316', type: 'EXPENSE' },
  { name: 'Supermercado', icon: 'shopping-cart', color: '#22C55E', type: 'EXPENSE' },
  { name: 'Transporte', icon: 'fuel', color: '#3B82F6', type: 'EXPENSE' },
  { name: 'Casa', icon: 'home', color: '#A855F7', type: 'EXPENSE' },
  { name: 'Servicios', icon: 'zap', color: '#EAB308', type: 'EXPENSE' },
  { name: 'Salud', icon: 'heart-pulse', color: '#EF4444', type: 'EXPENSE' },
  { name: 'Educación', icon: 'graduation-cap', color: '#06B6D4', type: 'EXPENSE' },
  { name: 'Entretenimiento', icon: 'clapperboard', color: '#EC4899', type: 'EXPENSE' },
  { name: 'Suscripciones', icon: 'repeat', color: '#8B5CF6', type: 'EXPENSE' },
  { name: 'Ropa', icon: 'shirt', color: '#14B8A6', type: 'EXPENSE' },
  { name: 'Mascotas', icon: 'paw-print', color: '#F59E0B', type: 'EXPENSE' },
  { name: 'Otros gastos', icon: 'circle-ellipsis', color: '#64748B', type: 'EXPENSE' },
  // Ingresos
  { name: 'Salario', icon: 'briefcase', color: '#10B981', type: 'INCOME' },
  { name: 'Negocio', icon: 'store', color: '#0EA5E9', type: 'INCOME' },
  { name: 'Remesas', icon: 'send', color: '#6366F1', type: 'INCOME' },
  { name: 'Otros ingresos', icon: 'plus-circle', color: '#84CC16', type: 'INCOME' },
] as const;

for (const c of categories) {
  // userId null no entra en el índice único de Postgres, así que se busca antes de crear.
  const found = await prisma.category.findFirst({ where: { userId: null, name: c.name, type: c.type } });
  if (!found) await prisma.category.create({ data: c });
}
console.log(`Categorías del sistema listas (${categories.length}).`);
await prisma.$disconnect();
