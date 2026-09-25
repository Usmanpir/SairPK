import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireManagementApi } from '@/lib/admin/guard';
import { logAudit } from '@/lib/admin/audit';
import { canManageRole, ROLE_LABELS } from '@/lib/roles';
import { updateUserSchema } from '@/lib/validation/admin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user: actor, error } = await requireManagementApi();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid account details.', details: parsed.error.flatten() }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

  const isSelf = target.id === actor.id;
  // Editing your own profile details is always allowed; everything else needs rank over the target.
  if (!isSelf && !canManageRole(actor.role, target.role)) {
    return NextResponse.json({ error: `You cannot edit ${ROLE_LABELS[target.role]} accounts.` }, { status: 403 });
  }

  const { name, email, phone, role, isActive, password } = parsed.data;

  if (isSelf && role !== undefined && role !== target.role) {
    return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 400 });
  }
  if (isSelf && isActive === false) {
    return NextResponse.json({ error: 'You cannot suspend your own account.' }, { status: 400 });
  }
  if (role !== undefined && role !== target.role && !canManageRole(actor.role, role)) {
    return NextResponse.json({ error: `You cannot assign the ${ROLE_LABELS[role]} role.` }, { status: 403 });
  }

  const data: Prisma.UserUpdateInput = {};
  const changes: string[] = [];
  if (name !== undefined && name !== target.name) {
    data.name = name;
    changes.push('name');
  }
  if (email !== undefined && email !== target.email) {
    data.email = email;
    changes.push('email');
  }
  if (phone !== undefined && (phone ?? null) !== target.phone) {
    data.phone = phone ?? null;
    changes.push('phone');
  }
  if (role !== undefined && role !== target.role) {
    data.role = role;
    changes.push(`role → ${ROLE_LABELS[role]}`);
  }
  if (isActive !== undefined && isActive !== target.isActive) {
    data.isActive = isActive;
    changes.push(isActive ? 'reactivated' : 'suspended');
  }
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 12);
    changes.push('password reset');
  }

  if (changes.length === 0) return NextResponse.json({ success: true });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: target.id }, data });
      await logAudit(tx, {
        actorId: actor.id,
        action: 'user.update',
        entityType: 'User',
        entityId: target.id,
        summary: `Updated ${email ?? target.email}: ${changes.join(', ')}`
      });
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'Another account already uses this email or phone.' }, { status: 409 });
    }
    console.error('Admin user update failed', err);
    return NextResponse.json({ error: 'Could not update the account.' }, { status: 500 });
  }
}
