import { Suspense } from 'react';
import Link from 'next/link';
import { AlertTriangle, CalendarDays, SearchX, Users } from 'lucide-react';
import { HotelSearchForm } from '@/components/search/HotelSearchForm';
import { HotelCard } from '@/components/hotels/HotelCard';
import { searchHotels } from '@/lib/queries/hotels';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default async function HotelsSearchPage({
  searchParams
}: {
  searchParams: { destination?: string; checkIn?: string; checkOut?: string; adults?: string; rooms?: string };
}) {
  const checkIn = searchParams.checkIn ?? todayISO(7);
  const checkOut = searchParams.checkOut ?? todayISO(9);
  const adults = Number(searchParams.adults ?? '2');
  const rooms = Number(searchParams.rooms ?? '1');

  let results: Awaited<ReturnType<typeof searchHotels>> = [];
  let searchError: string | null = null;

  try {
    results = await searchHotels({
      destination: searchParams.destination,
      checkIn,
      checkOut,
      adults,
      rooms
    });
  } catch (err) {
    console.error('Hotel search failed on results page', err);
    searchError = 'We could not load hotels right now. Please try again in a moment.';
  }

  const searchQuery = new URLSearchParams({
    checkIn,
    checkOut,
    adults: String(adults),
    rooms: String(rooms)
  }).toString();

  const availableCount = results.filter((r) => r.startingPrice != null).length;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/70 bg-gradient-to-b from-accent/70 to-background">
        <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="container relative py-10 sm:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Find your stay</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            {searchParams.destination ? (
              <>
                Hotels in <span className="font-display font-medium italic text-primary">{searchParams.destination}</span>
              </>
            ) : (
              'All hotels'
            )}
          </h1>
          <div className="mt-8">
            <Suspense fallback={<div className="h-[164px] rounded-[1.5rem] bg-white shadow-lift lg:h-[92px]" />}>
              <HotelSearchForm />
            </Suspense>
          </div>
        </div>
      </section>

      <div className="container py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {!searchError && (
              <>
                <span className="font-bold text-foreground">{results.length}</span> propert
                {results.length === 1 ? 'y' : 'ies'} found
                {results.length > 0 && <> · {availableCount} available for your dates</>}
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              {formatDate(checkIn)} → {formatDate(checkOut)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
              <Users className="h-3.5 w-3.5 text-primary" />
              {adults} guest{adults !== 1 ? 's' : ''} · {rooms} room{rooms !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {searchError && (
          <EmptyState tone="error" icon={<AlertTriangle />} title="Something went wrong" description={searchError} />
        )}

        {!searchError && results.length === 0 && (
          <EmptyState
            icon={<SearchX />}
            title="No hotels found"
            description={
              <>
                No hotels found for these dates. Try adjusting your search, or seed demo data with{' '}
                <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">npm run db:seed</code>.
              </>
            }
            action={
              <Button asChild variant="outline">
                <Link href="/hotels">Clear search</Link>
              </Button>
            }
          />
        )}

        <div className="grid grid-cols-1 gap-5">
          {results.map((hotel, i) => (
            <div key={hotel.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <HotelCard hotel={hotel} searchQuery={searchQuery} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
