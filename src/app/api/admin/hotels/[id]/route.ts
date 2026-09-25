import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireManagementApi } from '@/lib/admin/guard';
import { logAudit } from '@/lib/admin/audit';
import { updateHotelSchema } from '@/lib/validation/admin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user: actor, error } = await requireManagementApi();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = updateHotelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid hotel details.', details: parsed.error.flatten() }, { status: 400 });
  }
  const { status, managerId } = parsed.data;

  const hotel = await prisma.hotel.findUnique({ where: { id: params.id } });
  if (!hotel) return NextResponse.json({ error: 'Hotel not found.' }, { status: 404 });

  const data: Prisma.HotelUpdateInput = {};
  const changes: string[] = [];

  if (status !== undefined && status !== hotel.status) {
    data.status = status;
    changes.push(`status ${hotel.status} → ${status}`);
  }
  if (managerId !== undefined && managerId !== hotel.managerId) {
    if (managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } });
      if (!manager || manager.role !== 'HOTEL_MANAGER') {
        return NextResponse.json({ error: 'The selected account is not a hotel manager.' }, { status: 400 });
      }
      data.manager = { connect: { id: managerId } };
      changes.push(`manager → ${manager.email}`);
    } else {
      data.manager = { disconnect: true };
      changes.push('manager removed');
    }
  }

  if (changes.length === 0) return NextResponse.json({ success: true });

  await prisma.$transaction(async (tx) => {
    await tx.hotel.update({ where: { id: hotel.id }, data });
    await logAudit(tx, {
      actorId: actor.id,
      action: 'hotel.update',
      entityType: 'Hotel',
      entityId: hotel.id,
      summary: `${hotel.name}: ${changes.join(', ')}`
    });
  });

  return NextResponse.json({ success: true });
}
