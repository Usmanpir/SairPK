import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, FileText } from 'lucide-react';
import { prisma } from '@/lib/db';
import { toNumber } from '@/lib/pricing';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { CheckoutSteps } from '@/components/booking/CheckoutSteps';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function ConfirmationPage({ params }: { params: { bookingId: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { items: { include: { room: { include: { hotel: true } } } }, payment: true, invoice: true }
  });

  if (!booking) notFound();

  const item = booking.items[0];
  const isPaid = booking.status === 'PAID' || booking.status === 'CONFIRMED';

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-accent to-transparent" aria-hidden />
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-x-0 top-0 h-80 opacity-60" aria-hidden />

      <div className="container relative max-w-2xl py-12">
        <div className="mx-auto mb-10 max-w-lg">
          <CheckoutSteps current={isPaid ? 3 : 2} />
        </div>

        <div className="mb-10 flex flex-col items-center text-center">
          {isPaid ? (
            <>
              <div className="relative mb-6 animate-pop-in">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-iteration-count:2]" />
                <span className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-primary text-white shadow-glow ring-8 ring-primary/10">
                  <Check className="h-10 w-10" strokeWidth={3} />
                </span>
              </div>
              <h1 className="animate-fade-up text-3xl font-extrabold sm:text-4xl">Booking confirmed!</h1>
              <p className="mt-3 max-w-md animate-fade-up text-muted-foreground" style={{ animationDelay: '80ms' }}>
                A confirmation has been sent to <span className="font-medium text-foreground">{booking.guestEmail}</span>.
              </p>
            </>
          ) : (
            <>
              <span className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-amber-50 text-amber-600 ring-8 ring-amber-500/10">
                <Clock className="h-9 w-9" />
              </span>
              <h1 className="text-3xl font-extrabold">Booking status</h1>
              <Badge variant="gold" className="mt-3 px-3 py-1 text-sm">{booking.status}</Badge>
            </>
          )}
          <div className="mt-5 inline-flex animate-fade-up items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-soft" style={{ animationDelay: '140ms' }}>
            <span className="text-muted-foreground">Reference</span>
            <span className="font-mono font-bold text-foreground">{booking.reference}</span>
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
          {item && (
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
          )}

          {booking.invoice && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" /> Invoice #{booking.invoice.invoiceNo}
            </p>
          )}
        </div>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline" size="lg">
            <Link href="/hotels">Browse more hotels</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
