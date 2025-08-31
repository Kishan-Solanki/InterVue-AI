import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/change-password', '/verifyemail'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;

  // If token exists
  if (token) {
    try {
      // Authenticated users should NOT access public pages
      if (PUBLIC_PATHS.includes(pathname)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      return NextResponse.next();
    } catch (err) {
      // Token might be invalid or expired - clear it
      const res = NextResponse.redirect(new URL('/login', req.url));
      res.cookies.set('token', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/',
      });
      return res;
    }
  }

  // No token
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next(); // Allow access to public pages
  }

  // Trying to access protected route without token
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/change-password',
    '/verifyemail',
    '/profile',
  ],
};
