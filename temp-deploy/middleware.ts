import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isNextAuth = request.nextUrl.pathname.startsWith('/_next/');

  const publicRoutes = ['/landing', '/privacy', '/terms'];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  if (isNextAuth || isApiRoute) {
    return NextResponse.next();
  }

  // If not logged in and requesting root, rewrite to landing
  if (!token && request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/landing', request.url));
  }

  if (!token && !isLoginPage && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
