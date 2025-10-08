import { NextRequest, NextResponse } from 'next/server';
import { prisma, isPrismaAvailable } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/authDb';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    if (!isPrismaAvailable) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    const authError = await getAuthenticatedUser(req);
    if (!authError && typeof authError === 'string') {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const user = authError as any;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all users with their stats - excluding password hash for security
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        imageCount: true,
        imageLimit: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        // Include generation history to show what types of generations they use
        generations: {
          select: {
            id: true,
            type: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Last 10 generations
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch users' }, { status: 500 });
  }
}
