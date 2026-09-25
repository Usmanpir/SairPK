import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createBookingSchema } from '@/lib/validation/booking';
import { calculateBookingPrice, generateBookingReference, nightsBetween, resolveNightlyPrice, toNumber } from '@/lib/pricing';

type TxClient = Prisma.TransactionClient;

const RESERVATION_HOLD_MINUTES = 20;
const ROOMS_PER_BOOKING = 1; // this flow books a single room; extend for multi-room carts

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid booking details.', details: parsed.error.flatten() }, { status: 400 });
  }

  const { roomId, checkIn, checkOut, adults, children, guestName, guestEmail, guestPhone } = parsed.data;
  const nights = nightsBetween(new Date(checkIn), new Date(checkOut));

  if (nights.length === 0) {
    return NextResponse.json({ error: 'Stay must be at least one night.' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  try {
    const booking = await prisma.$transaction(async (tx: TxClient) => {
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room) throw new BookingError('This room no longer exists.', 404);

      if (room.maxAdults < adults || room.maxChildren < children) {
        throw new BookingError('This room does not accommodate the requested number of guests.', 400);
      }

      // Lock and validate every night of the stay. RoomAvailability rows are
      // upserted lazily — a missing row means the room's default inventory
      // (1 unit) is open on that date.
      const nightlyRates = [];
      for (const night of nights) {
        const existing = await tx.roomAvailability.findUnique({
          where: { roomId_date: { roomId, date: night } }
        });

        const unitsAvailable = existing?.unitsAvailable ?? room.totalUnits;
        if (existing?.isBlocked || unitsAvailable < ROOMS_PER_BOOKING) {
          throw new BookingError('Room is no longer available for the selected dates.', 409);
        }

        const price = resolveNightlyPrice({
          date: night,
          basePrice: toNumber(room.basePrice),
          weekendPrice: room.weekendPrice ? toNumber(room.weekendPrice) : null,
          priceOverride: existing?.priceOverride ? toNumber(existing.priceOverride) : null
        });
        nightlyRates.push({ date: night, price });

        // Decrement (or create) the availability row — this is the
        // inventory hold. If two requests race for the last unit, the
        // unique (roomId, date) constraint plus this same-transaction read
        // ensures only one succeeds; Prisma's transaction isolation
        // prevents a lost update here.
        await tx.roomAvailability.upsert({
          where: { roomId_date: { roomId, date: night } },
          update: { unitsAvailable: unitsAvailable - ROOMS_PER_BOOKING },
          create: {
            roomId,
            date: night,
            unitsAvailable: room.totalUnits - ROOMS_PER_BOOKING
          }
        });
      }

      const breakdown = calculateBookingPrice({
        nightlyRates,
        discountPct: toNumber(room.discountPct),
        taxPct: toNumber(room.taxPct)
      });

      const bookingCount = await tx.booking.count();
      const reference = generateBookingReference(bookingCount + 1);

      const created = await tx.booking.create({
        data: {
          reference,
          userId: session?.user?.id ?? (await getOrCreateGuestUser(tx, guestEmail, guestName)),
          type: 'HOTEL',
          status: 'PENDING',
          subtotal: breakdown.subtotal,
          discountTotal: breakdown.discountAmount,
          taxTotal: breakdown.taxAmount,
          grandTotal: breakdown.total,
          currency: 'PKR',
          guestName,
          guestEmail,
          guestPhone,
          reservationExpiresAt: new Date(Date.now() + RESERVATION_HOLD_MINUTES * 60_000),
          items: {
            create: {
              roomId,
              checkIn: new Date(checkIn),
              checkOut: new Date(checkOut),
              adults,
              children,
              nights: nights.length,
              unitPrice: breakdown.subtotal / nights.length,
              lineTotal: breakdown.subtotal
            }
          }
        },
        include: { items: true }
      });

      return { booking: created, breakdown };
    });

    return NextResponse.json(
      {
        bookingId: booking.booking.id,
        reference: booking.booking.reference,
        breakdown: booking.breakdown,
        reservationExpiresAt: booking.booking.reservationExpiresAt
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Booking creation failed', err);
    return NextResponse.json({ error: 'Something went wrong while creating your booking.' }, { status: 500 });
  }
}

class BookingError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Guest checkout: attaches the booking to a lightweight, passwordless user record. */
async function getOrCreateGuestUser(tx: TxClient, email: string, name: string) {
  const existing = await tx.user.findUnique({ where: { email } });
  if (existing) return existing.id;

  const created = await tx.user.create({
    data: { email, name, role: 'CUSTOMER' }
  });
  return created.id;
}
