import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isManagementRole } from '@/lib/roles';

export interface ManagementUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Resolves the signed-in management user, re-reading role and active status
 * from the database — the JWT role can be stale after an account is demoted
 * or suspended, so it is never trusted on its own for management actions.
 */
export async function getManagementUser(): Promise<ManagementUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, isActive: true }
  });
  if (!user || !user.isActive || !isManagementRole(user.role)) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** For server components under /admin: redirects anyone without management access. */
export async function requireManagementPage(): Promise<ManagementUser> {
  const user = await getManagementUser();
  if (!user) {
    const session = await getServerSession(authOptions);
    redirect(session?.user ? '/' : '/login?callbackUrl=/admin');
  }
  return user;
}

/**
 * For /api/admin route handlers. Returns the user, or a ready-made error
 * response the handler should return as-is.
 */
export async function requireManagementApi(): Promise<
  { user: ManagementUser; error?: never } | { user?: never; error: NextResponse }
> {
  const user = await getManagementUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'You do not have access to the management dashboard.' }, { status: 403 }) };
  }
  return { user };
}
