import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Server-side, request-time authorization (VAPT-05): the client-only
// <AdminGuard> only takes effect after JS hydrates, and /dashboard and
// /book-slot previously had no auth check at all. This runs before any
// page code executes, for every matched request.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (pathname.startsWith('/admin')) {
    if (!session || role !== 'admin') {
      return NextResponse.redirect(new URL('/admin-login', req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/book-slot')) {
    if (!session) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/book-slot/:path*'],
  runtime: 'nodejs',
};
