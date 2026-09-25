import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, ChevronRight, Clock, Mail, MapPin, Phone, ShieldCheck, Users } from 'lucide-react';
import { getHotelBySlug } from '@/lib/queries/hotels';
import { nightsBetween, resolveNightlyPrice, toNumber } from '@/lib/pricing';
import { RoomCard, type RoomCardData } from '@/components/hotels/RoomCard';
import { SmartImage } from '@/components/ui/smart-image';
import { Stars } from '@/components/ui/stars';
import { AmenityIcon } from '@/components/ui/amenity-icon';
import { cn, formatDate, formatPKR } from '@/lib/utils';

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default async function HotelDetailPage({
  params,
  searchParams
}: {
  params: { id: string }; // route segment is [id] but we look up by slug
  searchParams: { checkIn?: string; checkOut?: string; adults?: string; rooms?: string };
}) {
  const hotel = await getHotelBySlug(params.id);
  if (!hotel) notFound();

  const checkIn = searchParams.checkIn ?? todayISO(7);
  const checkOut = searchParams.checkOut ?? todayISO(9);
  const adults = Number(searchParams.adults ?? '2');
  const roomsRequested = Number(searchParams.rooms ?? '1');
  const nights = nightsBetween(new Date(checkIn), new Date(checkOut));

  const roomCards: RoomCardData[] = hotel.rooms.map((room) => {
    const availabilityByDate = new Map(room.availability.map((a) => [a.date.toISOString().slice(0, 10), a]));

    let available = nights.length > 0;
    let total = 0;

    for (const night of nights) {
      const key = night.toISOString().slice(0, 10);
      const a = availabilityByDate.get(key);
      if (a?.isBlocked || (a && a.unitsAvailable < roomsRequested)) {
        available = false;
        break;
      }
      total += resolveNightlyPrice({
        date: night,
        basePrice: toNumber(room.basePrice),
        weekendPrice: room.weekendPrice ? toNumber(room.weekendPrice) : null,
        priceOverride: a?.priceOverride ? toNumber(a.priceOverride) : null
      });
    }

    if (room.maxAdults * roomsRequested < adults) available = false;

    return {
      id: room.id,
      name: room.name,
      type: room.type,
      bedType: room.bedType,
      maxAdults: room.maxAdults,
      maxChildren: room.maxChildren,
      amenities: room.amenities.map((a) => a.name),
      nightlyPrice: available ? Math.round(total / nights.length) : null,
      totalPrice: available ? Math.round(total) : null,
      nights: nights.length
    };
  });

  const bookingQuery = new URLSearchParams({ checkIn, checkOut, adults: String(adults) }).toString();

  const availablePrices = roomCards.map((r) => r.nightlyPrice).filter((p): p is number => p != null);
  const lowestPrice = availablePrices.length ? Math.min(...availablePrices) : null;

  // Always show a full 5-tile gallery; missing tiles fall back to scenic art.
  const gallery = Array.from({ length: 5 }, (_, i) => hotel.images[i] ?? null);

  return (
    <div className="container py-8 sm:py-10">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/hotels?${new URLSearchParams({ destination: hotel.destination.name, checkIn, checkOut, adults: String(adults), rooms: String(roomsRequested) })}`} className="hover:text-foreground">
          {hotel.destination.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate font-medium text-foreground">{hotel.name}</span>
      </nav>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Stars rating={hotel.starRating} />
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{hotel.name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            {hotel.destination.name} · {hotel.address}
          </p>
        </div>
        {lowestPrice != null && (
          <div className="sm:text-right">
            <p className="text-xs font-medium text-muted-foreground">Rooms from</p>
            <p className="text-2xl font-extrabold">
              {formatPKR(lowestPrice)}
              <span className="text-sm font-medium text-muted-foreground"> / night</span>
            </p>
          </div>
        )}
      </div>

      <div className="mb-10 grid h-[260px] grid-cols-2 grid-rows-2 gap-2 overflow-hidden rounded-3xl sm:h-[420px] sm:grid-cols-4">
        {gallery.map((img, i) => (
          <div
            key={img?.id ?? `placeholder-${i}`}
            className={cn(
              'group relative overflow-hidden bg-muted',
              i === 0 ? 'col-span-2 row-span-2' : 'hidden sm:block'
            )}
          >
            <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
              <SmartImage src={img?.url} alt={img?.alt ?? hotel.name} seed={`${hotel.name}-${i}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section>
            <h2 className="text-xl font-bold">About this hotel</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{hotel.description}</p>
          </section>

          {hotel.amenities.length > 0 && (
            <section>
              <h2 className="text-xl font-bold">Amenities</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {hotel.amenities.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 text-sm font-medium shadow-sm">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                      <AmenityIcon name={a.name} className="h-4 w-4" />
                    </span>
                    {a.name}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section id="rooms" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-xl font-bold">Available rooms</h2>
              <p className="text-sm text-muted-foreground">
                {formatDate(checkIn)} → {formatDate(checkOut)} · {nights.length} night{nights.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {roomCards.map((room) => (
                <RoomCard key={room.id} room={room} bookingQuery={bookingQuery} />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
            <div className="bg-gradient-to-br from-primary to-emerald-800 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Your stay</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-white/65">Check-in</p>
                  <p className="font-semibold">{formatDate(checkIn)}</p>
                </div>
                <div>
                  <p className="text-white/65">Check-out</p>
                  <p className="font-semibold">{formatDate(checkOut)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 text-primary" />
                {adults} guest{adults !== 1 ? 's' : ''} · {roomsRequested} room{roomsRequested !== 1 ? 's' : ''}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                {nights.length} night{nights.length !== 1 ? 's' : ''}
              </p>
              <a
                href="#rooms"
                className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-px"
              >
                Choose a room
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-5 text-sm shadow-soft">
            <h3 className="font-bold">Policies</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/70 p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Check-in</p>
                <p className="mt-1 font-semibold">{hotel.checkInTime}</p>
              </div>
              <div className="rounded-xl bg-muted/70 p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Check-out</p>
                <p className="mt-1 font-semibold">{hotel.checkOutTime}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2.5 rounded-xl border border-primary/15 bg-accent/60 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="whitespace-pre-line leading-relaxed text-foreground/80">{hotel.cancellationPolicy}</p>
            </div>
          </div>

          {(hotel.contactPhone || hotel.contactEmail) && (
            <div className="rounded-2xl border border-border/80 bg-card p-5 text-sm shadow-soft">
              <h3 className="font-bold">Contact</h3>
              <div className="mt-3 space-y-2 text-muted-foreground">
                {hotel.contactPhone && (
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {hotel.contactPhone}</p>
                )}
                {hotel.contactEmail && (
                  <p className="flex items-center gap-2 break-all"><Mail className="h-4 w-4 shrink-0 text-primary" /> {hotel.contactEmail}</p>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
