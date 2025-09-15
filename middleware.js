import { NextResponse } from 'next/server';

export function middleware(req) {
  const token = req.cookies.get('token')?.value;
  const url = req.nextUrl.clone();

  const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/change-password', '/verifyemail'];
  const AUTH_PATHS = ['/dashboard', '/interview'];

  // Add debug headers
  const res = NextResponse.next();
  res.headers.set('X-Debug-Token', token || 'NO_TOKEN');
  res.headers.set('X-Debug-Path', url.pathname);

  // If user has token, block public auth pages
  if (token && PUBLIC_PATHS.includes(url.pathname)) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If user has no token, block protected pages
  if (!token && AUTH_PATHS.some(path => url.pathname.startsWith(path))) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'],
};
