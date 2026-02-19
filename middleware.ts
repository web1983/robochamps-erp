import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const role = (token as any).role;

    // Protect trainer routes
    if (path.startsWith('/trainer') && role !== 'TRAINER_ROBOCHAMPS' && role !== 'TRAINER_SCHOOL') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Protect admin/teacher routes
    if (path.startsWith('/dashboard') && (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL')) {
      return NextResponse.redirect(new URL('/trainer/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/trainer/:path*'],
};
