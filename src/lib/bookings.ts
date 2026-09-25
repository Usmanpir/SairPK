import type { BookingStatus, Prisma, PrismaClient } from '@prisma/client';
import { nightsBetween } from '@/lib/pricing';

type TxClient = Prisma.TransactionClient;

/** Next sequential invoice number, e.g. INV-2026-000042. */
export async function nextInvoiceNo(db: PrismaClient | TxClient): Promise<string> {
  const invoiceCount = await db.invoice.count();
  return `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;
}

/** Statuses in which a booking no longer holds room inventory. */
export const INVENTORY_RELEASED_STATUSES: BookingStatus[] = ['CANCELLED', 'REFUNDED', 'EXPIRED'];

export function holdsInventory(status: BookingStatus): boolean {
  return !INVENTORY_RELEASED_STATUSES.includes(status);
}

/** Returns one unit per night of every booked room back to RoomAvailability. */
export async function releaseBookingInventory(
  tx: TxClient,
  items: { roomId: string | null; checkIn: Date; checkOut: Date }[]
) {
  for (const item of items) {
    if (!item.roomId) continue;
    for (const night of nightsBetween(item.checkIn, item.checkOut)) {
      await tx.roomAvailability.updateMany({
        where: { roomId: item.roomId, date: night },
        data: { unitsAvailable: { increment: 1 } }
      });
    }
  }
}
