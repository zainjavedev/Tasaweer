import { NextRequest, NextResponse } from 'next/server';
import { prisma, isPrismaAvailable } from '@/lib/prisma';
import { hashPassword, getAuthenticatedUser } from '@/lib/authDb';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
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

    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'User ID and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
      select: { id: true, username: true, email: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      user: updatedUser
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Password reset failed' }, { status: 500 });
  }
}
