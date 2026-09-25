import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { initiatePaymentSchema } from '@/lib/validation/booking';
import { getPaymentProvider } from '@/lib/payments/mock-provider';
import { toNumber } from '@/lib/pricing';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = initiatePaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payment request.', details: parsed.error.flatten() }, { status: 400 });
  }

  const { bookingId, method } = parsed.data;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }
  if (booking.status !== 'PENDING' && booking.status !== 'PAYMENT_PENDING') {
    return NextResponse.json({ error: 'This booking is not awaiting payment.' }, { status: 409 });
  }
  if (booking.reservationExpiresAt && booking.reservationExpiresAt < new Date()) {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'EXPIRED' } });
    return NextResponse.json({ error: 'Your reservation hold has expired. Please book again.' }, { status: 410 });
  }

  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'PAYMENT_PENDING' } });

  const provider = getPaymentProvider();
  const result = await provider.charge({
    amount: toNumber(booking.grandTotal),
    currency: booking.currency,
    bookingReference: booking.reference,
    customerEmail: booking.guestEmail,
    method
  });

  if (!result.success) {
    await prisma.payment.upsert({
      where: { bookingId },
      update: { status: 'FAILED', method, providerTxnId: result.providerTxnId, providerRaw: result.raw as object },
      create: {
        bookingId,
        amount: booking.grandTotal,
        currency: booking.currency,
        method,
        status: 'FAILED',
        providerTxnId: result.providerTxnId,
        providerRaw: result.raw as object
      }
    });
    return NextResponse.json({ error: result.failureReason ?? 'Payment failed. Please try another method.' }, { status: 402 });
  }

  const invoiceCount = await prisma.invoice.count();
  const invoiceNo = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;

  await prisma.$transaction([
    prisma.payment.upsert({
      where: { bookingId },
      update: { status: 'SUCCESS', method, providerTxnId: result.providerTxnId, providerRaw: result.raw as object },
      create: {
        bookingId,
        amount: booking.grandTotal,
        currency: booking.currency,
        method,
        status: 'SUCCESS',
        providerTxnId: result.providerTxnId,
        providerRaw: result.raw as object
      }
    }),
    prisma.booking.update({ where: { id: bookingId }, data: { status: 'PAID' } }),
    prisma.invoice.create({ data: { bookingId, invoiceNo } })
  ]);

  return NextResponse.json({ success: true, bookingId, status: 'PAID' });
}
