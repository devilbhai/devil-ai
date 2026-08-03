import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { cookies } from 'next/headers';

function checkAuth(cookies: any) {
  return cookies.get('admin_token')?.value === 'devil-auth-super-secret-token';
}

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const cookieStore = await cookies();
  if (!checkAuth(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await params;
  const body = await request.json();

  try {
    if (action === 'ban') {
      const user = await prisma.user.findUnique({ where: { id: body.userId } });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      const newStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
      await prisma.user.update({ where: { id: body.userId }, data: { status: newStatus, activeDeviceId: newStatus === 'BANNED' ? null : undefined } });
      if (newStatus === 'BANNED') {
        await prisma.subscription.updateMany({ where: { userId: body.userId, status: 'ACTIVE' }, data: { status: 'CANCELLED' } });
      }
      return NextResponse.json({ success: true, status: newStatus });
    }

    if (action === 'delete') {
      await prisma.subscription.deleteMany({ where: { userId: body.userId } });
      await prisma.payment.deleteMany({ where: { userId: body.userId } });
      await prisma.workspace.deleteMany({ where: { userId: body.userId } });
      await prisma.user.delete({ where: { id: body.userId } });
      return NextResponse.json({ success: true });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
