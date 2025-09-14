import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No database configured' }, { status: 400 });
  }
  try {
    const token = req.nextUrl.searchParams.get('token')?.trim() || '';
    if (!token) return NextResponse.json({ error: 'Missing or empty token' }, { status: 400 });
    const now = new Date();
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    if (user.verificationTokenExpires && user.verificationTokenExpires