import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/authDb';
import { prisma, isPrismaAvailable } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    const cookie = req.headers.get('cookie') || '';
    const cookieToken = cookie.split('; ').find((c) => c.startsWith('auth_token='))?.split('=')[1];
    const token = bearer || (cookieToken ? decodeURIComponent(cookieToken) : null);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!isPrismaAvailable) {
      return NextResponse.json({ username: payload.username, role: 'FREE', imageCount: 0, imageLimit: null, email: null, verified: false });
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ username: user.username, role: user.role, imageCount: user.imageCount, imageLimit: user.imageLimit, effectiveLimit: user.imageLimit, email: user.email, verified: Boolean(user.emailVerifiedAt) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unauthorized' }, { status: 401 });
  }
}
