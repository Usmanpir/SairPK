import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarX2, ShieldCheck, UserRound } from 'lucide-react';
import { getRoomWithHotel } from '@/lib/queries/rooms';
import { calculateBookingPrice, nightsBetween, resolveNightlyPrice, toNumber } from '@/lib/pricing';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { GuestDetailsForm } from '@/components/booking/GuestDetailsForm';
import { CheckoutSteps } from '@/components/booking/CheckoutSteps';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export default async function BookingPage({
  params,
  searchParams
}: {
  params: { roomId: string };
  searchParams: { checkIn?: string; checkOut?: string; adults?: string; children?: string };
}) {
  const room = await getRoomWithHotel(params.roomId);
  if (!room) notFound();

  if (!searchParams.checkIn || !searchParams.checkOut) {
    return (
      <div className="container max-w-2xl py-20">
        <EmptyState
          tone="warning"
          icon={<CalendarX2 />}
          title="Missing stay dates"
          description="Missing check-in/check-out dates. Please search again from the hotel page."
          action={
            <Button asChild>
              <Link href="/hotels">Search hotels</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const checkIn = searchParams.checkIn;
  const checkOut = searchParams.checkOut;
  const adults = Number(searchParams.adults ?? '2');
  const childrenCount = Number(searchParams.children ?? '0');
  const nights = nightsBetween(new Date(checkIn), new Date(checkOut));

  const availabilityByDate = new Map(room.availability.map((a) => [a.date.toISOString().slice(0, 10), a]));
  const nightlyRates = nights.map((night) => {
    const a = availabilityByDate.get(night.toISOString().slice(0, 10));
    return {
      date: night,
      price: resolveNightlyPrice({
        date: night,
        basePrice: toNumber(room.basePrice),
        weekendPrice: room.weekendPrice ? toNumber(room.weekendPrice) : null,
        priceOverride: a?.priceOverride ? toNumber(a.priceOverride) : null
      })
    };
  });

  const breakdown = calculateBookingPrice({
    nightlyRates,
    discountPct: toNumber(room.discountPct),
    taxPct: toNumber(room.taxPct)
  });

  return (
    <div className="bg-gradient-to-b from-muted/60 to-background">
      <div className="container max-w-5xl py-10">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Almost there</p>
            <h1 className="mt-2 text-3xl font-extrabold">Complete your booking</h1>
          </div>
          <div className="sm:w-[28rem]">
            <CheckoutSteps current={0} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold">Guest details</h2>
                <p className="text-sm text-muted-foreground">Who&apos;s checking in?</p>
              </div>
            </div>
            <GuestDetailsForm
              roomId={room.id}
              checkIn={checkIn}
              checkOut={checkOut}
              adults={adults}
              childrenCount={childrenCount}
            />
          </div>
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <BookingSummary
              hotelName={room.hotel.name}
              roomName={room.name}
              checkIn={checkIn}
              checkOut={checkOut}
              nights={nights.length}
              adults={adults}
              childrenCount={childrenCount}
              subtotal={breakdown.subtotal}
              discountAmount={breakdown.discountAmount}
              taxAmount={breakdown.taxAmount}
              total={breakdown.total}
            />
            {room.hotel.cancellationPolicy && (
              <div className="flex gap-3 rounded-2xl border border-primary/15 bg-accent/50 p-4 text-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="leading-relaxed text-foreground/80">{room.hotel.cancellationPolicy}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
