import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { cookies } from 'next/headers';

function checkAuth(cookies: any) {
  return cookies.get('admin_token')?.value === 'devil-auth-super-secret-token';
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!checkAuth(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();

    if (body.action === 'create') {
      const { userId, planId, durationDays } = body;
      if (!userId || !planId || !durationDays) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

      const now = new Date();
      const end = new Date(now.getTime() + Number(durationDays) * 24 * 60 * 60 * 1000);

      // Cancel all existing ACTIVE subscriptions for this user (override old plan)
      await prisma.subscription.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      await prisma.subscription.create({
        data: { userId, planId, status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: end },
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'cancel') {
      await prisma.subscription.update({ where: { id: body.id }, data: { status: 'CANCELLED' } });
      return NextResponse.json({ success: true });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
