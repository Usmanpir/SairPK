import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isManagementRole } from '@/lib/roles';

/**
 * First line of defence for the management dashboard: bounces signed-out
 * visitors to login and non-management users to the public site. Pages and
 * /api/admin handlers re-check the role against the database as well, since
 * the JWT role can be stale.
 */
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const login = new URL('/login', req.url);
    login.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(login);
  }

  if (!isManagementRole(token.role)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
