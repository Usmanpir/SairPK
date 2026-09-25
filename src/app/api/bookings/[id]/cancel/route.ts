import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { nightsBetween } from '@/lib/pricing';

type TxClient = Prisma.TransactionClient;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.$transaction(async (tx: TxClient) => {
      const booking = await tx.booking.findUnique({ where: { id: params.id }, include: { items: true } });
      if (!booking) throw new Error('NOT_FOUND');
      if (booking.status === 'CANCELLED') return;

      // Release held inventory for every night of every item back to availability.
      for (const item of booking.items) {
        if (!item.roomId) continue;
        const nights = nightsBetween(item.checkIn, item.checkOut);
        for (const night of nights) {
          const existing = await tx.roomAvailability.findUnique({
            where: { roomId_date: { roomId: item.roomId, date: night } }
          });
          if (existing) {
            await tx.roomAvailability.update({
              where: { id: existing.id },
              data: { unitsAvailable: existing.unitsAvailable + 1 }
            });
          }
        }
      }

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
