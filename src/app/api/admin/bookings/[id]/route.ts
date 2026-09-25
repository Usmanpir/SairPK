import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireManagementApi } from '@/lib/admin/guard';
import { logAudit } from '@/lib/admin/audit';
import { holdsInventory, releaseBookingInventory } from '@/lib/bookings';
import { updateBookingSchema } from '@/lib/validation/admin';

class AdminBookingError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user: actor, error } = await requireManagementApi();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = updateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid booking details.', details: parsed.error.flatten() }, { status: 400 });
  }
  const { status, guestName, guestEmail, guestPhone } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: params.id }, include: { items: true } });
      if (!booking) throw new AdminBookingError('Booking not found.', 404);

      const data: Prisma.BookingUpdateInput = {};
      const changes: string[] = [];

      if (guestName !== undefined && guestName !== booking.guestName) {
        data.guestName = guestName;
        changes.push('guest name');
      }
      if (guestEmail !== undefined && guestEmail !== booking.guestEmail) {
        data.guestEmail = guestEmail;
        changes.push('guest email');
      }
      if (guestPhone !== undefined && guestPhone !== booking.guestPhone) {
        data.guestPhone = guestPhone;
        changes.push('guest phone');
      }

      if (status !== undefined && status !== booking.status) {
        const wasHolding = holdsInventory(booking.status);
        const willHold = holdsInventory(status);
        // Re-activating a cancelled booking would need a fresh availability check
        // and re-reservation, which the booking flow owns — don't fake it here.
        if (!wasHolding && willHold) {
          throw new AdminBookingError(
            `A ${booking.status.toLowerCase()} booking cannot be reopened. Create a new booking instead.`,
            409
          );
        }
        if (wasHolding && !willHold) {
          await releaseBookingInventory(tx, booking.items);
        }
        data.status = status;
        changes.push(`status ${booking.status} → ${status}`);
      }

      if (changes.length === 0) return;

      await tx.booking.update({ where: { id: booking.id }, data });
      await logAudit(tx, {
        actorId: actor.id,
        action: 'booking.update',
        entityType: 'Booking',
        entityId: booking.id,
        summary: `${booking.reference}: ${changes.join(', ')}`
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AdminBookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Admin booking update failed', err);
    return NextResponse.json({ error: 'Could not update the booking.' }, { status: 500 });
  }
}
