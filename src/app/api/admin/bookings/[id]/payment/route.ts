import { NextRequest, NextResponse } from 'next/server';
import type { BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireManagementApi } from '@/lib/admin/guard';
import { logAudit } from '@/lib/admin/audit';
import { holdsInventory, nextInvoiceNo, releaseBookingInventory } from '@/lib/bookings';
import { formatPKR } from '@/lib/utils';
import { upsertPaymentSchema } from '@/lib/validation/admin';

class AdminPaymentError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Records or corrects the payment for a booking from the dashboard — e.g. a
 * cash or bank-transfer payment taken offline, a changed amount, or a refund.
 * Keeps the booking status and invoice in step with the payment status.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { user: actor, error } = await requireManagementApi();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = upsertPaymentSchema.safeParse(body);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return NextResponse.json(
      { error: first ?? 'Invalid payment details.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { amount, method, status, providerTxnId, notes } = parsed.data;
  // A full refund with no amount entered means the whole payment was returned.
  const refundedAmount = status === 'REFUNDED' && parsed.data.refundedAmount === 0 ? amount : parsed.data.refundedAmount;

  try {
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: params.id },
        include: { items: true, payment: true, invoice: true }
      });
      if (!booking) throw new AdminPaymentError('Booking not found.', 404);

      if (status === 'SUCCESS' && !holdsInventory(booking.status)) {
        throw new AdminPaymentError(
          `This booking is ${booking.status.toLowerCase()}; it can't be marked as paid.`,
          409
        );
      }

      let nextBookingStatus: BookingStatus | null = null;
      if (status === 'SUCCESS' && (booking.status === 'PENDING' || booking.status === 'PAYMENT_PENDING')) {
        nextBookingStatus = 'PAID';
      } else if (status === 'REFUNDED' && booking.status !== 'REFUNDED') {
        nextBookingStatus = 'REFUNDED';
      }

      const fields = {
        amount,
        refundedAmount,
        method,
        status,
        providerTxnId: providerTxnId ?? null,
        notes: notes ?? null,
        refundStatus: status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED' ? status : null
      };
      await tx.payment.upsert({
        where: { bookingId: booking.id },
        update: fields,
        create: { bookingId: booking.id, currency: booking.currency, ...fields }
      });

      if (nextBookingStatus) {
        if (holdsInventory(booking.status) && !holdsInventory(nextBookingStatus)) {
          await releaseBookingInventory(tx, booking.items);
        }
        await tx.booking.update({ where: { id: booking.id }, data: { status: nextBookingStatus } });
      }

      if (status === 'SUCCESS' && !booking.invoice) {
        await tx.invoice.create({ data: { bookingId: booking.id, invoiceNo: await nextInvoiceNo(tx) } });
      }

      const summaryParts = [`${booking.reference}: payment ${status} ${formatPKR(amount)} via ${method}`];
      if (refundedAmount > 0) summaryParts.push(`refunded ${formatPKR(refundedAmount)}`);
      if (nextBookingStatus) summaryParts.push(`booking → ${nextBookingStatus}`);
      await logAudit(tx, {
        actorId: actor.id,
        action: booking.payment ? 'payment.update' : 'payment.create',
        entityType: 'Booking',
        entityId: booking.id,
        summary: summaryParts.join(', ')
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AdminPaymentError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Admin payment update failed', err);
    return NextResponse.json({ error: 'Could not save the payment.' }, { status: 500 });
  }
}
