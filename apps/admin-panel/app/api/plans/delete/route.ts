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
    await prisma.plan.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
