import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'gunjan@agribee.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'DevilBhai@1010';

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  const origin = request.headers.get('origin') || 'https://devil-ai.agribee.in';

  let email: string;
  let password: string;

  if (contentType.includes('application/json')) {
    const body = await request.json();
    email = body.email;
    password = body.password;
  } else {
    const formData = await request.formData();
    email = formData.get('email') as string;
    password = formData.get('password') as string;
  }

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('admin_token', 'devil-auth-super-secret-token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    if (contentType.includes('application/json')) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.redirect(`${origin}/`, 302);
  }

  if (contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  return NextResponse.redirect(`${origin}/login?error=1`, 302);
}
