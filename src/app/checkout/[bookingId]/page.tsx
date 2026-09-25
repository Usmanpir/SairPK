import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, CreditCard, Hourglass } from 'lucide-react';
import { prisma } from '@/lib/db';
import { toNumber } from '@/lib/pricing';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { PaymentForm } from '@/components/booking/PaymentForm';
import { CheckoutSteps } from '@/components/booking/CheckoutSteps';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export default async function CheckoutPage({ params }: { params: { bookingId: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { items: { include: { room: { include: { hotel: true } } } } }
  });

  if (!booking) notFound();

  if (booking.status === 'PAID' || booking.status === 'CONFIRMED') {
    return (
      <div className="container max-w-2xl py-20">
        <EmptyState
          icon={<CheckCircle2 />}
          title="Already paid"
          description="This booking has already been paid."
          action={
            <Button asChild>
              <Link href={`/booking/confirmation/${booking.id}`}>View confirmation</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (booking.status === 'EXPIRED' || (booking.reservationExpiresAt && booking.reservationExpiresAt < new Date())) {
    return (
      <div className="container max-w-2xl py-20">
        <EmptyState
          tone="warning"
          icon={<Hourglass />}
          title="Reservation hold expired"
          description="Your reservation hold has expired. Please search again and re-book to hold the room."
          action={
            <Button asChild>
              <Link href="/hotels">Search again</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const item = booking.items[0];

  return (
    <div className="bg-gradient-to-b from-muted/60 to-background">
      <div className="container max-w-5xl py-10">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Secure checkout</p>
            <h1 className="mt-2 text-3xl font-extrabold">Checkout</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Booking reference:{' '}
              <span className="rounded-md bg-card px-2 py-0.5 font-mono text-xs font-semibold text-foreground ring-1 ring-border">
                {booking.reference}
              </span>
            </p>
          </div>
          <div className="sm:w-[28rem]">
            <CheckoutSteps current={1} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                <CreditCard className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold">Select payment method</h2>
                <p className="text-sm text-muted-foreground">Choose how you&apos;d like to pay.</p>
              </div>
            </div>
            <PaymentForm bookingId={booking.id} />
          </div>
          {item && (
            <div className="lg:sticky lg:top-24 lg:self-start">
              <BookingSummary
                hotelName={item.room?.hotel.name ?? 'Hotel'}
                roomName={item.room?.name ?? 'Room'}
                checkIn={item.checkIn}
                checkOut={item.checkOut}
                nights={item.nights}
                adults={item.adults}
                childrenCount={item.children}
                subtotal={toNumber(booking.subtotal)}
                discountAmount={toNumber(booking.discountTotal)}
                taxAmount={toNumber(booking.taxTotal)}
                total={toNumber(booking.grandTotal)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
