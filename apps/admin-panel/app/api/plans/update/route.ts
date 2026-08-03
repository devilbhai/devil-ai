import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { cookies } from 'next/headers';

function checkAuth(cookies: any) {
  return cookies.get('admin_token')?.value === 'devil-auth-super-secret-token';
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!checkAuth(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, slug, name, price, durationDays, features, isBestValue, sortOrder, isActive } = body;

    if (!slug || !name || !price || !durationDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (id) {
      const updated = await prisma.plan.update({
        where: { id },
        data: { slug: slug.toUpperCase(), name, price: Number(price), durationDays: Number(durationDays), features: features || '', isBestValue: isBestValue || false, sortOrder: Number(sortOrder || 0), isActive: isActive !== undefined ? isActive : true },
      });
      return NextResponse.json({ success: true, plan: updated });
    }

    const created = await prisma.plan.create({
      data: { slug: slug.toUpperCase(), name, price: Number(price), durationDays: Number(durationDays), features: features || '', isBestValue: isBestValue || false, sortOrder: Number(sortOrder || 0), isActive: isActive !== undefined ? isActive : true },
    });
    return NextResponse.json({ success: true, plan: created });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
