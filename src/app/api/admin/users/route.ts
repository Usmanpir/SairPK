import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireManagementApi } from '@/lib/admin/guard';
import { logAudit } from '@/lib/admin/audit';
import { canManageRole, ROLE_LABELS } from '@/lib/roles';
import { createUserSchema } from '@/lib/validation/admin';

export async function POST(req: NextRequest) {
  const { user: actor, error } = await requireManagementApi();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid account details.', details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, phone, role, password } = parsed.data;
  if (!canManageRole(actor.role, role)) {
    return NextResponse.json({ error: `You cannot create ${ROLE_LABELS[role]} accounts.` }, { status: 403 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name, email, phone: phone ?? null, role, passwordHash } });
      await logAudit(tx, {
        actorId: actor.id,
        action: 'user.create',
        entityType: 'User',
        entityId: user.id,
        summary: `Created ${ROLE_LABELS[role]} account ${email}`
      });
      return user;
    });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email or phone already exists.' }, { status: 409 });
    }
    console.error('Admin user creation failed', err);
    return NextResponse.json({ error: 'Could not create the account.' }, { status: 500 });
  }
}
