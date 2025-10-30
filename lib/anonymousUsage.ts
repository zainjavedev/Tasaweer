import { prisma, isPrismaAvailable } from '@/lib/prisma';
import { GenerationType } from '@prisma/client';
import { hashPassword } from '@/lib/authDb';

const ANONYMOUS_USERNAME = process.env.ANONYMOUS_USER_USERNAME || 'anonymous';
const ANONYMOUS_EMAIL = process.env.ANONYMOUS_USER_EMAIL;
const ANONYMOUS_SECRET = process.env.ANONYMOUS_USER_SECRET || 'anonymous';

let cachedAnonymousUserId: string | null = null;
let ensurePromise: Promise<string | null> | null = null;

async function ensureAnonymousUserId(): Promise<string | null> {
  if (!isPrismaAvailable) return null;
  if (cachedAnonymousUserId) return cachedAnonymousUserId;

  if (!ensurePromise) {
    ensurePromise = (async () => {
      const existing = await prisma.user.findUnique({ where: { username: ANONYMOUS_USERNAME } });
      if (existing) {
        cachedAnonymousUserId = existing.id;
        return cachedAnonymousUserId;
      }

      const passwordHash = await hashPassword(ANONYMOUS_SECRET);
      const created = await prisma.user.create({
        data: {
          username: ANONYMOUS_USERNAME,
          email: ANONYMOUS_EMAIL || undefined,
          passwordHash,
          role: 'ANONYMOUS',
          imageLimit: null,
          imageCount: 0,
        },
      });
      cachedAnonymousUserId = created.id;
      return cachedAnonymousUserId;
    })().catch((err) => {
      console.error('Failed to ensure anonymous user record', err);
      return null;
    }).finally(() => {
      ensurePromise = null;
    });
  }

  const id = await ensurePromise;
  if (!id) cachedAnonymousUserId = null;
  return id;
}

export async function recordAnonymousGeneration(type: GenerationType) {
  if (!isPrismaAvailable) return;

  try {
    const userId = await ensureAnonymousUserId();
    if (!userId) return;

    await prisma.$transaction([
      prisma.generation.create({
        data: {
          userId,
          type,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { imageCount: { increment: 1 } },
      }),
    ]);
  } catch (err) {
    console.error('Failed to record anonymous generation', err);
  }
}
