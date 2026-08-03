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
      const { code, discountPercentage, maxUses } = body;
      if (!code || !discountPercentage) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      await prisma.coupon.create({
        data: { code: code.toUpperCase(), discountPercentage: Number(discountPercentage), maxUses: Number(maxUses || 100), currentUses: 0 },
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'delete') {
      await prisma.coupon.delete({ where: { id: body.id } });
      return NextResponse.json({ success: true });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
