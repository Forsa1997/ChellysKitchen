// Prisma Client Singleton
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  return prisma;
};

export const disconnectPrisma = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectPrisma();
});

process.on('SIGINT', async () => {
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectPrisma();
  process.exit(0);
});