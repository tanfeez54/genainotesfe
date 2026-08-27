import { NextResponse, type NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Simple check for our session cookie
  const hasSession = request.cookies.has('notegen_session');

  // Protected routes that require login
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/classes') ||
    pathname.startsWith('/scan') ||
    pathname.startsWith('/question-bank') ||
    pathname.startsWith('/generate-paper') ||
    pathname.startsWith('/notes') ||
    pathname.startsWith('/subjects') ||
    pathname.startsWith('/settings');

  // Auth routes (redirect to classes if already logged in)
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/set-password');

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/classes';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
