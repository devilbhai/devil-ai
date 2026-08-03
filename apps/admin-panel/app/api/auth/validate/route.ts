import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-devil-ai-key';

const PLAN_DURATIONS: Record<string, number> = {
  WEEKLY: 7,
  MONTHLY: 30,
  YEARLY: 365,
  LIFETIME: 36500,
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ valid: false, message: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ valid: false, message: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { subscriptions: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!user) {
      return NextResponse.json({ valid: false, message: 'User not found' }, { status: 401 });
    }

    if (user.status === 'BANNED') {
      return NextResponse.json({ valid: false, message: 'Account is banned' }, { status: 403 });
    }

    const activeSub = user.subscriptions[0];

    if (!activeSub) {
      return NextResponse.json({ valid: false, planId: null, expiresAt: null, daysRemaining: 0 });
    }

    const now = new Date();
    const periodEnd = new Date(activeSub.currentPeriodEnd);

    if (now > periodEnd) {
      await prisma.subscription.update({
        where: { id: activeSub.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ valid: false, planId: null, expiresAt: null, daysRemaining: 0 });
    }

    const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      valid: true,
      planId: activeSub.planId,
      expiresAt: activeSub.currentPeriodEnd.toISOString(),
      daysRemaining,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('Validate error:', error);
    return NextResponse.json({ valid: false, message: 'Internal server error' }, { status: 500 });
  }
}
