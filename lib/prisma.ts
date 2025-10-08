import { PrismaClient } from '@prisma/client';

type GlobalWithPrisma = typeof globalThis & { prisma?: PrismaClient };

const globalForPrisma = globalThis as GlobalWithPrisma;

let prismaClient: PrismaClient | undefined = globalForPrisma.prisma;

const createClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

export const isPrismaAvailable = Boolean(process.env.DATABASE_URL);

export const getPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }
  if (!prismaClient) {
    prismaClient = createClient();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaClient;
    }
  }
  return prismaClient;
};

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    return Reflect.get(client, prop, receiver);
  },
  has(_target, prop) {
    const client = getPrismaClient();
    return Reflect.has(client as object, prop);
  },
}) as PrismaClient;
