import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isManagementRole } from '@/lib/roles';

/**
 * Default landing spot after sign-in (credentials and Google alike): sends
 * management accounts to their dashboard and everyone else to the public site.
 * A route handler rather than a page, so it answers with a plain 307 instead
 * of streaming a loading screen first.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const target = isManagementRole(session?.user?.role) ? '/admin' : '/';
  return NextResponse.redirect(new URL(target, req.url));
}
