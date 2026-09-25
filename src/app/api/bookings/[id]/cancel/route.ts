import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { holdsInventory, releaseBookingInventory } from '@/lib/bookings';

type TxClient = Prisma.TransactionClient;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.$transaction(async (tx: TxClient) => {
      const booking = await tx.booking.findUnique({ where: { id: params.id }, include: { items: true } });
      if (!booking) throw new Error('NOT_FOUND');
      // Already cancelled/refunded/expired: its inventory was released before, don't release it twice.
      if (!holdsInventory(booking.status)) return;

      // Release held inventory for every night of every item back to availability.
      await releaseBookingInventory(tx, booking.items);

      await tx.booking.update({
        where: { id: params.id },
        data: { status: booking.status === 'PAID' || booking.status === 'CONFIRMED' ? 'REFUNDED' : 'CANCELLED' }
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }
    console.error('Cancellation failed', err);
    return NextResponse.json({ error: 'Could not cancel this booking.' }, { status: 500 });
  }
}
